<?php

namespace Database\Seeders;

use App\Models\CustomFieldDefinition;
use App\Models\Folder;
use App\Models\Item;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Roles
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $memberRole = Role::firstOrCreate(['name' => 'member']);

        // 2. Users
        $ada = User::firstOrCreate(
            ['email' => 'ada@example.com'],
            [
                'name' => 'Ada Admin',
                'password' => Hash::make('password'),
            ]
        );
        $ada->assignRole($adminRole);

        $morgan = User::firstOrCreate(
            ['email' => 'morgan@example.com'],
            [
                'name' => 'Morgan Member',
                'password' => Hash::make('password'),
            ]
        );
        $morgan->assignRole($memberRole);

        $alex = User::firstOrCreate(
            ['email' => 'alex@example.com'],
            [
                'name' => 'Alex Suspended',
                'password' => Hash::make('password'),
                'banned_at' => now()->subDays(3),
                'ban_reason' => 'Violation of security and acceptable use policy.',
            ]
        );
        $alex->assignRole($memberRole);

        // 3. Workspaces
        $engWorkspace = Workspace::firstOrCreate(
            ['slug' => 'engineering'],
            [
                'name' => 'Engineering',
                'is_private' => false,
            ]
        );

        $hrWorkspace = Workspace::firstOrCreate(
            ['slug' => 'hr'],
            [
                'name' => 'HR Department',
                'is_private' => true,
            ]
        );

        // Attach workspace access
        $ada->workspaces()->sync([$engWorkspace->id, $hrWorkspace->id]);
        $morgan->workspaces()->sync([$engWorkspace->id]);

        // 4. Folders
        $engFolder = Folder::firstOrCreate(
            ['workspace_id' => $engWorkspace->id, 'prefix' => 'ENG'],
            [
                'name' => 'Engineering',
                'current_number' => 14,
            ]
        );

        $hrFolder = Folder::firstOrCreate(
            ['workspace_id' => $hrWorkspace->id, 'prefix' => 'HR'],
            [
                'name' => 'HR Recruitment',
                'current_number' => 1,
            ]
        );

        // 5. Custom Field Definitions for HR
        $hrFields = [
            [
                'folder_id' => $hrFolder->id,
                'name' => 'Candidate Email',
                'key' => 'condidat_mail',
                'type' => 'email',
                'is_required' => true,
                'order_index' => 0,
            ],
            [
                'folder_id' => $hrFolder->id,
                'name' => 'Candidate Phone',
                'key' => 'condidat_phone',
                'type' => 'phone',
                'is_required' => false,
                'order_index' => 1,
            ],
            [
                'folder_id' => $hrFolder->id,
                'name' => 'Candidate Availability',
                'key' => 'condidat_disponibilte',
                'type' => 'text',
                'is_required' => false,
                'order_index' => 2,
            ],
            [
                'folder_id' => $hrFolder->id,
                'name' => 'Candidate Resume',
                'key' => 'condidat_resume',
                'type' => 'file',
                'is_required' => false,
                'order_index' => 3,
            ],
        ];

        foreach ($hrFields as $field) {
            CustomFieldDefinition::firstOrCreate(
                ['folder_id' => $field['folder_id'], 'key' => $field['key']],
                $field
            );
        }

        // 6. Sample Items
        // Standalone ENG-9
        Item::firstOrCreate(
            ['code' => 'ENG-9'],
            [
                'folder_id' => $engFolder->id,
                'title' => 'Setup Kubernetes staging cluster and CI/CD pipelines',
                'description' => json_encode([
                    'type' => 'doc',
                    'content' => [
                        [
                            'type' => 'paragraph',
                            'content' => [
                                ['type' => 'text', 'text' => 'Provision high-availability k8s cluster for testing multi-region failover and blue/green deployments.'],
                            ],
                        ],
                    ],
                ]),
                'status' => 'Done',
                'priority' => 'normal',
                'assignee_id' => $morgan->id,
                'creator_id' => $ada->id,
                'start_date' => now()->subDays(10)->toDateString(),
                'due_date' => now()->subDays(2)->toDateString(),
                'order_index' => 0,
            ]
        );

        // Standalone ENG-11
        Item::firstOrCreate(
            ['code' => 'ENG-11'],
            [
                'folder_id' => $engFolder->id,
                'title' => 'Implement OAuth2 and SAML SSO integration',
                'description' => json_encode([
                    'type' => 'doc',
                    'content' => [
                        [
                            'type' => 'paragraph',
                            'content' => [
                                ['type' => 'text', 'text' => 'Configure enterprise single sign-on with Okta and Google Workspace providers.'],
                            ],
                        ],
                    ],
                ]),
                'status' => 'In Progress',
                'priority' => 'high',
                'assignee_id' => $ada->id,
                'creator_id' => $ada->id,
                'start_date' => now()->subDays(3)->toDateString(),
                'due_date' => now()->addDays(5)->toDateString(),
                'order_index' => 1,
            ]
        );

        // Main Item ENG-12
        $item12 = Item::firstOrCreate(
            ['code' => 'ENG-12'],
            [
                'folder_id' => $engFolder->id,
                'title' => 'Redesign authentication and user profile architecture',
                'description' => json_encode([
                    'type' => 'doc',
                    'content' => [
                        [
                            'type' => 'paragraph',
                            'content' => [
                                ['type' => 'text', 'text' => 'Refactor the session guard and add multi-device session revocation, audit logging, and team permission checks.'],
                            ],
                        ],
                        [
                            'type' => 'bulletList',
                            'content' => [
                                [
                                    'type' => 'listItem',
                                    'content' => [
                                        ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Verify banned status on every request']]],
                                    ],
                                ],
                                [
                                    'type' => 'listItem',
                                    'content' => [
                                        ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Secure API token rotation mechanism']]],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ]),
                'status' => 'In Progress',
                'priority' => 'urgent',
                'assignee_id' => $ada->id,
                'creator_id' => $ada->id,
                'start_date' => now()->subDays(2)->toDateString(),
                'due_date' => now()->addDays(4)->toDateString(),
                'order_index' => 2,
            ]
        );

        // Subitems for ENG-12: ENG-13, ENG-14
        Item::firstOrCreate(
            ['code' => 'ENG-13'],
            [
                'folder_id' => $engFolder->id,
                'parent_id' => $item12->id,
                'title' => 'Create session invalidation middleware for banned users',
                'description' => json_encode([
                    'type' => 'doc',
                    'content' => [
                        [
                            'type' => 'paragraph',
                            'content' => [
                                ['type' => 'text', 'text' => 'Intercept active requests and invalidate cookie tokens immediately upon account suspension.'],
                            ],
                        ],
                    ],
                ]),
                'status' => 'Done',
                'priority' => 'high',
                'assignee_id' => $ada->id,
                'creator_id' => $ada->id,
                'order_index' => 0,
            ]
        );

        Item::firstOrCreate(
            ['code' => 'ENG-14'],
            [
                'folder_id' => $engFolder->id,
                'parent_id' => $item12->id,
                'title' => 'Build 2FA QR code verification dialog',
                'description' => json_encode([
                    'type' => 'doc',
                    'content' => [
                        [
                            'type' => 'paragraph',
                            'content' => [
                                ['type' => 'text', 'text' => 'Allow users to scan TOTP secret keys and enter one-time passwords with fallback recovery codes.'],
                            ],
                        ],
                    ],
                ]),
                'status' => 'Backlog',
                'priority' => 'normal',
                'assignee_id' => $morgan->id,
                'creator_id' => $ada->id,
                'order_index' => 1,
            ]
        );

        // HR Record HR-1
        Item::firstOrCreate(
            ['code' => 'HR-1'],
            [
                'folder_id' => $hrFolder->id,
                'title' => 'Senior Full-Stack Engineer Candidate - Alex Rivera',
                'description' => json_encode([
                    'type' => 'doc',
                    'content' => [
                        [
                            'type' => 'paragraph',
                            'content' => [
                                ['type' => 'text', 'text' => 'Top candidate from referral round. 8+ years experience in React, TypeScript, and Laravel architectures. Passed preliminary technical screening with exceptional score.'],
                            ],
                        ],
                    ],
                ]),
                'status' => 'In Review',
                'priority' => 'high',
                'assignee_id' => $ada->id,
                'creator_id' => $ada->id,
                'start_date' => now()->toDateString(),
                'due_date' => now()->addDays(7)->toDateString(),
                'fields_data' => [
                    'condidat_mail' => 'alex.rivera@example.com',
                    'condidat_phone' => '+1 (555) 234-5678',
                    'condidat_disponibilte' => '2 weeks notice',
                    'condidat_resume' => 'resume_alex_rivera.pdf',
                ],
                'order_index' => 0,
            ]
        );
    }
}
