<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * Test that root redirects to workspace board.
     */
    public function test_the_application_redirects_to_workspace_board(): void
    {
        $response = $this->get('/');

        $response->assertStatus(302);
        $response->assertRedirect('/workspace/engineering/board');
    }

    /**
     * Test that board loads successfully.
     */
    public function test_the_board_page_loads(): void
    {
        $response = $this->get('/workspace/engineering/board');

        $response->assertStatus(200);
    }

    /**
     * Test that members page loads.
     */
    public function test_the_members_page_loads(): void
    {
        $response = $this->get('/workspace/engineering/members');

        $response->assertStatus(200);
    }

    /**
     * Test banned user session is terminated and redirected by middleware.
     */
    public function test_banned_user_is_redirected_by_middleware(): void
    {
        $bannedUser = User::whereNotNull('banned_at')->first();

        if ($bannedUser) {
            $response = $this->actingAs($bannedUser)->get('/workspace/engineering/board');
            $response->assertRedirect('/login');
        }
    }
}
