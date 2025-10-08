const express = require('express');
const router = express.Router();
const ContentReport = require('../models/ContentReport');
const UserViolation = require('../models/UserViolation');
const ContentModeration = require('../models/ContentModeration');
const CommunityGuidelines = require('../models/CommunityGuidelines');
const User = require('../models/User');
const Post = require('../models/Post');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get community guidelines
router.get('/guidelines', async (req, res) => {
    try {
        const guidelines = await CommunityGuidelines.getActiveGuidelines();
        res.json({ success: true, guidelines });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Report content
router.post('/report', authenticateToken, async (req, res) => {
    try {
        const {
            contentType,
            contentId,
            contentOwner,
            reportReason,
            reportSubcategory,
            description,
            evidence
        } = req.body;

        // Get content snapshot
        let contentSnapshot = {};
        if (contentType === 'post') {
            const post = await Post.findById(contentId);
            if (post) {
                contentSnapshot = {
                    text: post.content.text,
                    mediaUrls: post.content.media?.map(m => m.url) || [],
                    timestamp: post.createdAt
                };
            }
        }

        const report = await ContentReport.create({
            reporter: req.user.id,
            reportedContent: {
                contentType,
                contentId,
                contentOwner,
                contentSnapshot
            },
            reportReason,
            reportSubcategory,
            description,
            evidence,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        // Auto-escalate critical reports
        if (['terrorism', 'child_safety', 'self_harm'].includes(reportReason)) {
            await report.escalate();
        }

        res.status(201).json({ 
            success: true, 
            message: 'Report submitted successfully',
            reportId: report._id
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get pending reports (Admin only)
router.get('/reports/pending', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        const reports = await ContentReport.getPendingReports(limit);
        res.json({ success: true, reports });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Review report (Admin only)
router.put('/reports/:reportId/review', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { action, reason, reviewNotes } = req.body;
        const report = await ContentReport.findById(req.params.reportId);

        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        await report.resolve({
            action,
            reason
        }, req.user.id);

        report.reviewNotes = reviewNotes;
        await report.save();

        // Take action based on decision
        if (action === 'content_removed') {
            // Remove the content
            const { contentType, contentId } = report.reportedContent;
            if (contentType === 'post') {
                await Post.findByIdAndUpdate(contentId, { isArchived: true });
            }
        }

        // Create user violation if necessary
        if (['content_removed', 'user_warned', 'user_restricted', 'user_suspended', 'user_banned'].includes(action)) {
            const violationSeverity = {
                'user_warned': 'low',
                'content_removed': 'medium',
                'user_restricted': 'high',
                'user_suspended': 'high',
                'user_banned': 'critical'
            };

            const violationAction = {
                'user_warned': 'warning',
                'content_removed': 'content_removal',
                'user_restricted': 'feature_restriction',
                'user_suspended': 'temporary_suspension',
                'user_banned': 'permanent_ban'
            };

            await UserViolation.create({
                user: report.reportedContent.contentOwner,
                violationType: report.reportReason,
                severity: violationSeverity[action],
                description: reason,
                relatedReport: report._id,
                action: {
                    type: violationAction[action],
                    startDate: Date.now(),
                    endDate: action === 'user_suspended' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null
                },
                issuedBy: req.user.id,
                issuedBySystem: false
            });

            // Update user status if banned or suspended
            if (action === 'user_banned') {
                await User.findByIdAndUpdate(report.reportedContent.contentOwner, {
                    membershipStatus: 'cancelled'
                });
            } else if (action === 'user_suspended') {
                await User.findByIdAndUpdate(report.reportedContent.contentOwner, {
                    membershipStatus: 'suspended'
                });
            }
        }

        res.json({ success: true, message: 'Report reviewed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get user violations
router.get('/violations/user/:userId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const violations = await UserViolation.getUserViolations(req.params.userId);
        const strikeCount = await UserViolation.getUserStrikeCount(req.params.userId);
        
        res.json({ success: true, violations, strikeCount });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Appeal a violation
router.post('/violations/:violationId/appeal', authenticateToken, async (req, res) => {
    try {
        const { reason } = req.body;
        const violation = await UserViolation.findById(req.params.violationId);

        if (!violation) {
            return res.status(404).json({ success: false, message: 'Violation not found' });
        }

        if (violation.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await violation.submitAppeal(reason);

        res.json({ success: true, message: 'Appeal submitted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get content requiring moderation (Admin only)
router.get('/content/review', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        const content = await ContentModeration.getContentRequiringReview(limit);
        res.json({ success: true, content });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Moderate content (Admin only)
router.put('/content/:moderationId/moderate', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { action, reason } = req.body;
        const moderation = await ContentModeration.findById(req.params.moderationId);

        if (!moderation) {
            return res.status(404).json({ success: false, message: 'Moderation record not found' });
        }

        if (action === 'approve') {
            await moderation.approveContent(req.user.id);
        } else if (action === 'remove') {
            await moderation.removeContent(req.user.id, reason);
        }

        res.json({ success: true, message: 'Content moderated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
