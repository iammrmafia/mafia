// Meta-style Community Guidelines for The Mafia Inc. Social Platform
// This follows Facebook/Instagram/Meta's comprehensive community standards

module.exports = {
    version: '1.0.0',
    effectiveDate: new Date('2025-01-01'),
    isActive: true,
    
    guidelines: {
        // 1. Violence and Criminal Behavior
        violenceAndCriminal: {
            title: 'Violence and Criminal Behavior',
            description: 'We aim to prevent potential offline harm that may be related to content on our platform. While we understand that people commonly express disdain or disagreement by threatening or calling for violence in non-serious ways, we remove language that incites or facilitates serious violence.',
            rules: [
                {
                    rule: 'Do not post content that threatens violence or depicts graphic violence',
                    examples: [
                        'Threats of physical harm against individuals or groups',
                        'Statements of intent to commit violence',
                        'Instructions on how to make weapons',
                        'Graphic depictions of violence against people or animals'
                    ],
                    severity: 'critical'
                },
                {
                    rule: 'Do not coordinate or promote criminal activity',
                    examples: [
                        'Organizing illegal activities',
                        'Promoting illegal drug sales',
                        'Human trafficking or exploitation',
                        'Theft, fraud, or other financial crimes'
                    ],
                    severity: 'critical'
                },
                {
                    rule: 'Do not glorify or promote dangerous organizations',
                    examples: [
                        'Content that praises terrorist organizations',
                        'Recruitment for violent extremist groups',
                        'Symbols or slogans of hate groups'
                    ],
                    severity: 'critical'
                }
            ],
            prohibitedContent: [
                'Threats of violence',
                'Incitement to violence',
                'Graphic violence',
                'Criminal activity coordination',
                'Dangerous organizations promotion',
                'Weapon sales or manufacturing instructions'
            ],
            exceptions: [
                'News reporting on violence',
                'Educational content about history',
                'Artistic expression with appropriate warnings',
                'Awareness campaigns against violence'
            ]
        },
        
        // 2. Safety and Harmful Content
        safetyAndHarm: {
            title: 'Safety and Harmful Content',
            description: 'We remove content that could contribute to imminent physical harm, or that depicts or promotes suicide, self-injury, or eating disorders.',
            rules: [
                {
                    rule: 'Do not post content that promotes self-harm or suicide',
                    examples: [
                        'Content that encourages suicide or self-injury',
                        'Instructions on self-harm methods',
                        'Graphic images of self-harm',
                        'Content that mocks victims of suicide or self-injury'
                    ],
                    severity: 'critical'
                },
                {
                    rule: 'Do not promote eating disorders',
                    examples: [
                        'Content promoting extreme weight loss',
                        'Pro-anorexia or pro-bulimia content',
                        'Challenges that encourage dangerous eating habits'
                    ],
                    severity: 'high'
                },
                {
                    rule: 'Do not share dangerous challenges or stunts',
                    examples: [
                        'Challenges that could lead to injury or death',
                        'Dangerous pranks that could harm others',
                        'Stunts performed without proper safety measures'
                    ],
                    severity: 'high'
                }
            ],
            prohibitedContent: [
                'Suicide promotion or instructions',
                'Self-harm content',
                'Eating disorder promotion',
                'Dangerous challenges',
                'Content that could lead to physical harm'
            ]
        },
        
        // 3. Bullying and Harassment
        bullyingAndHarassment: {
            title: 'Bullying and Harassment',
            description: 'We do not tolerate bullying or harassment. We allow people to speak freely on matters and people of public interest, but remove content that appears to purposefully target private individuals with the intention of degrading or shaming them.',
            rules: [
                {
                    rule: 'Do not engage in targeted harassment',
                    examples: [
                        'Repeatedly contacting someone who has asked you to stop',
                        'Targeting someone with unwanted sexual advances',
                        'Calling for harassment of specific individuals',
                        'Sharing content to degrade or shame someone'
                    ],
                    severity: 'high'
                },
                {
                    rule: 'Do not engage in cyberbullying',
                    examples: [
                        'Creating fake accounts to harass someone',
                        'Sharing embarrassing information about someone',
                        'Coordinating attacks against an individual',
                        'Making derogatory comments about someone\'s appearance'
                    ],
                    severity: 'high'
                },
                {
                    rule: 'Do not dox or share private information',
                    examples: [
                        'Sharing someone\'s home address',
                        'Publishing private phone numbers',
                        'Revealing someone\'s workplace to cause harm',
                        'Sharing private communications without consent'
                    ],
                    severity: 'critical'
                }
            ],
            protectedGroups: [
                'Minors (under 18)',
                'Private individuals',
                'Victims of crimes',
                'Vulnerable populations'
            ]
        },
        
        // 4. Privacy and Personal Information
        privacyAndPersonalInfo: {
            title: 'Privacy and Personal Information',
            description: 'Privacy is important to us. We work hard to safeguard your personal identity and information, and we do not allow people to post certain types of personal or confidential information about yourself or others.',
            rules: [
                {
                    rule: 'Do not share private contact information',
                    examples: [
                        'Phone numbers',
                        'Home addresses',
                        'Email addresses (without consent)',
                        'Social security numbers or ID numbers'
                    ],
                    severity: 'critical'
                },
                {
                    rule: 'Do not share financial information',
                    examples: [
                        'Credit card numbers',
                        'Bank account details',
                        'Financial records',
                        'Payment information'
                    ],
                    severity: 'critical'
                },
                {
                    rule: 'Respect others\' privacy settings',
                    examples: [
                        'Do not screenshot and share private messages',
                        'Do not share content from private accounts without permission',
                        'Do not circumvent privacy settings'
                    ],
                    severity: 'high'
                }
            ],
            prohibitedSharing: [
                'Personal contact information',
                'Financial information',
                'Government-issued IDs',
                'Medical records',
                'Private correspondence',
                'Login credentials'
            ]
        },
        
        // 5. Hate Speech and Discrimination
        hateSpeechAndDiscrimination: {
            title: 'Hate Speech and Discrimination',
            description: 'We do not allow hate speech on our platform because it creates an environment of intimidation and exclusion and in some cases may promote real-world violence.',
            rules: [
                {
                    rule: 'Do not attack people based on protected characteristics',
                    examples: [
                        'Slurs or derogatory terms',
                        'Statements of inferiority',
                        'Calls for exclusion or segregation',
                        'Dehumanizing language'
                    ],
                    severity: 'critical'
                },
                {
                    rule: 'Do not promote hate organizations',
                    examples: [
                        'Praising hate groups',
                        'Using hate symbols',
                        'Promoting hate group ideology',
                        'Recruiting for hate organizations'
                    ],
                    severity: 'critical'
                },
                {
                    rule: 'Do not promote discrimination',
                    examples: [
                        'Advocating for denial of services',
                        'Promoting discriminatory policies',
                        'Encouraging segregation'
                    ],
                    severity: 'high'
                }
            ],
            protectedCharacteristics: [
                'Race',
                'Ethnicity',
                'National origin',
                'Religious affiliation',
                'Sexual orientation',
                'Gender identity',
                'Disability',
                'Serious disease',
                'Age'
            ]
        },
        
        // 6. Spam and Fake Engagement
        spamAndFakeEngagement: {
            title: 'Spam and Fake Engagement',
            description: 'We work hard to limit the spread of spam because we do not want to allow content that is designed to deceive, or that attempts to mislead users to increase viewership.',
            rules: [
                {
                    rule: 'Do not engage in spam behavior',
                    examples: [
                        'Repeatedly posting the same content',
                        'Mass following/unfollowing',
                        'Using automation to generate engagement',
                        'Posting misleading links'
                    ],
                    severity: 'medium'
                },
                {
                    rule: 'Do not artificially inflate engagement',
                    examples: [
                        'Buying likes, followers, or comments',
                        'Using bots to generate engagement',
                        'Engagement pods or groups',
                        'Like/follow exchange schemes'
                    ],
                    severity: 'high'
                },
                {
                    rule: 'Do not create fake accounts',
                    examples: [
                        'Multiple accounts for one person',
                        'Impersonation accounts',
                        'Bot accounts',
                        'Accounts created to manipulate metrics'
                    ],
                    severity: 'high'
                }
            ],
            prohibitedActivities: [
                'Spam posting',
                'Fake engagement',
                'Bot usage',
                'Misleading clickbait',
                'Scams and fraud',
                'Phishing attempts'
            ]
        },
        
        // 7. Intellectual Property
        intellectualProperty: {
            title: 'Intellectual Property',
            description: 'We respect intellectual property rights and expect our users to do the same. We remove content that violates copyright or trademark laws.',
            rules: [
                {
                    rule: 'Do not post copyrighted content without permission',
                    examples: [
                        'Full movies or TV shows',
                        'Music without proper licensing',
                        'Copyrighted images or artwork',
                        'Pirated software or games'
                    ],
                    severity: 'medium'
                },
                {
                    rule: 'Do not infringe on trademarks',
                    examples: [
                        'Using brand logos without permission',
                        'Impersonating brands',
                        'Selling counterfeit goods'
                    ],
                    severity: 'medium'
                },
                {
                    rule: 'Give proper attribution',
                    examples: [
                        'Credit original creators',
                        'Use proper citations',
                        'Respect Creative Commons licenses'
                    ],
                    severity: 'low'
                }
            ],
            copyrightPolicy: 'We respond to valid copyright complaints under the Digital Millennium Copyright Act (DMCA). Rights holders can submit takedown requests through our reporting system.',
            trademarkPolicy: 'We remove content that violates trademark rights when properly reported by the trademark owner or authorized representative.'
        },
        
        // 8. Misinformation and False News
        misinformationAndFalseNews: {
            title: 'Misinformation and False News',
            description: 'We reduce the spread of false news and misinformation because we believe that authentic communication is important.',
            rules: [
                {
                    rule: 'Do not spread harmful misinformation',
                    examples: [
                        'False health information that could cause harm',
                        'Election misinformation',
                        'Manipulated media (deepfakes)',
                        'False information during emergencies'
                    ],
                    severity: 'high'
                },
                {
                    rule: 'Do not impersonate news organizations',
                    examples: [
                        'Creating fake news sites',
                        'Misrepresenting yourself as a journalist',
                        'Using news organization branding without permission'
                    ],
                    severity: 'high'
                },
                {
                    rule: 'Label satire and parody appropriately',
                    examples: [
                        'Clearly mark satirical content',
                        'Do not present parody as real news',
                        'Use appropriate disclaimers'
                    ],
                    severity: 'medium'
                }
            ],
            factCheckingProcess: 'We work with independent fact-checkers to review and rate the accuracy of content. Content rated as false may have reduced distribution and warning labels.'
        },
        
        // 9. Adult Content and Nudity
        adultContentAndNudity: {
            title: 'Adult Content and Nudity',
            description: 'We restrict the display of nudity or sexual activity because some people in our community may be sensitive to this type of content. Additionally, we default to removing sexual imagery to prevent the sharing of non-consensual or underage content.',
            rules: [
                {
                    rule: 'Do not post sexual content',
                    examples: [
                        'Sexual activity',
                        'Sexual solicitation',
                        'Pornographic content',
                        'Sexual services'
                    ],
                    severity: 'critical'
                },
                {
                    rule: 'Do not post nudity',
                    examples: [
                        'Visible genitalia',
                        'Explicit nudity',
                        'Close-ups of buttocks'
                    ],
                    severity: 'high'
                },
                {
                    rule: 'Age-appropriate content only',
                    examples: [
                        'Content must be suitable for ages 13+',
                        'Adult content must be properly restricted',
                        'No content involving minors in sexual contexts'
                    ],
                    severity: 'critical'
                }
            ],
            allowedContent: [
                'Art and educational content with context',
                'Breastfeeding',
                'Protest or awareness campaigns',
                'Health-related content',
                'Indigenous peoples in traditional attire'
            ],
            prohibitedContent: [
                'Pornography',
                'Sexual activity',
                'Sexual solicitation',
                'Non-consensual intimate images',
                'Child sexual exploitation material (CSEM)'
            ]
        },
        
        // 10. Authenticity and Identity
        authenticityAndIdentity: {
            title: 'Authenticity and Identity',
            description: 'Authenticity is the cornerstone of our community. We believe that authenticity helps create a community where people are accountable for what they say and do.',
            rules: [
                {
                    rule: 'Use your real identity',
                    examples: [
                        'Use your real name',
                        'Provide accurate information',
                        'Do not create multiple accounts',
                        'Do not misrepresent your identity'
                    ],
                    severity: 'medium'
                },
                {
                    rule: 'Do not impersonate others',
                    examples: [
                        'Pretending to be another person',
                        'Using someone else\'s photos',
                        'Creating parody accounts without clear labeling',
                        'Impersonating public figures'
                    ],
                    severity: 'high'
                },
                {
                    rule: 'Do not engage in coordinated inauthentic behavior',
                    examples: [
                        'Creating networks of fake accounts',
                        'Coordinating to mislead people',
                        'Artificially amplifying content',
                        'Manipulating public discourse'
                    ],
                    severity: 'critical'
                }
            ],
            impersonationPolicy: 'We remove accounts that impersonate others. Parody, fan, and commentary accounts are allowed if clearly labeled and not intended to deceive.'
        }
    },
    
    // Enforcement Actions
    enforcementActions: [
        {
            violationType: 'violence_criminal',
            firstOffense: {
                action: 'content_removal',
                duration: 0,
                description: 'Content removed immediately. User receives warning.'
            },
            secondOffense: {
                action: 'temporary_restriction',
                duration: 7,
                description: 'Content removed. User restricted from posting for 7 days.'
            },
            thirdOffense: {
                action: 'temporary_ban',
                duration: 30,
                description: 'Account suspended for 30 days.'
            },
            appealable: true
        },
        {
            violationType: 'hate_speech',
            firstOffense: {
                action: 'content_removal',
                duration: 0,
                description: 'Content removed. User receives warning and educational resources.'
            },
            secondOffense: {
                action: 'temporary_restriction',
                duration: 14,
                description: 'Content removed. User restricted from posting for 14 days.'
            },
            thirdOffense: {
                action: 'permanent_ban',
                duration: null,
                description: 'Account permanently disabled.'
            },
            appealable: true
        },
        {
            violationType: 'harassment_bullying',
            firstOffense: {
                action: 'warning',
                duration: 0,
                description: 'User receives warning. Content may be removed.'
            },
            secondOffense: {
                action: 'temporary_restriction',
                duration: 7,
                description: 'User restricted from commenting and messaging for 7 days.'
            },
            thirdOffense: {
                action: 'temporary_ban',
                duration: 30,
                description: 'Account suspended for 30 days.'
            },
            appealable: true
        },
        {
            violationType: 'spam',
            firstOffense: {
                action: 'content_removal',
                duration: 0,
                description: 'Spam content removed. User warned.'
            },
            secondOffense: {
                action: 'temporary_restriction',
                duration: 3,
                description: 'User restricted from posting for 3 days.'
            },
            thirdOffense: {
                action: 'permanent_ban',
                duration: null,
                description: 'Account permanently disabled for repeated spam violations.'
            },
            appealable: true
        },
        {
            violationType: 'adult_content',
            firstOffense: {
                action: 'content_removal',
                duration: 0,
                description: 'Content removed. User receives warning.'
            },
            secondOffense: {
                action: 'temporary_restriction',
                duration: 14,
                description: 'User restricted from posting media for 14 days.'
            },
            thirdOffense: {
                action: 'permanent_ban',
                duration: null,
                description: 'Account permanently disabled.'
            },
            appealable: true
        },
        {
            violationType: 'misinformation',
            firstOffense: {
                action: 'warning',
                duration: 0,
                description: 'Content labeled as false information. Reach reduced.'
            },
            secondOffense: {
                action: 'content_removal',
                duration: 0,
                description: 'Content removed. User warned about repeated violations.'
            },
            thirdOffense: {
                action: 'temporary_restriction',
                duration: 30,
                description: 'User restricted from posting for 30 days.'
            },
            appealable: true
        }
    ],
    
    // Appeal Process
    appealProcess: {
        description: 'If you believe we made a mistake, you can request a review of our decision. Our team will review your appeal and respond within the specified timeframe.',
        timeframe: 'Most appeals are reviewed within 24-48 hours. Complex cases may take up to 7 days.',
        steps: [
            '1. Submit an appeal through the notification you received',
            '2. Provide additional context or information',
            '3. Our review team will examine your case',
            '4. You will receive a decision via notification',
            '5. If upheld, you may request a secondary review for serious violations'
        ],
        reviewCriteria: [
            'Whether the content violates our Community Guidelines',
            'Context and intent of the content',
            'Whether the enforcement action was appropriate',
            'Any additional information provided in the appeal',
            'User\'s violation history'
        ]
    }
};
