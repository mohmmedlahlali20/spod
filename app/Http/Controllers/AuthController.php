<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    /**
     * Display login page.
     */
    public function showLogin(): Response
    {
        return Inertia::render('auth/login', [
            'users' => User::all(['id', 'name', 'email', 'banned_at']),
        ]);
    }

    /**
     * Authenticate or quick-switch to a user.
     */
    public function switchUser(User $user): RedirectResponse
    {
        Auth::login($user);
        request()->session()->regenerate();

        if ($user->isBanned()) {
            return redirect()->route('login')->withErrors([
                'email' => "This account ({$user->name}) is suspended. Ban reason: {$user->ban_reason}",
            ]);
        }

        return redirect()->route('workspace.board', ['slug' => 'engineering'])
            ->with('success', "Logged in as {$user->name}.");
    }

    /**
     * Standard login submission.
     */
    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            if (Auth::user()->isBanned()) {
                $reason = Auth::user()->ban_reason;
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return back()->withErrors([
                    'email' => "This account is suspended. Ban reason: {$reason}",
                ]);
            }

            return redirect()->intended(route('workspace.board', ['slug' => 'engineering']));
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ]);
    }

    /**
     * Log out.
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
