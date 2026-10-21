import React, { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { User } from '@/types';
import { Lock, Mail, ShieldAlert, ArrowRight, CheckCircle2, UserCheck } from 'lucide-react';

interface LoginProps {
    users: User[];
}

export default function Login({ users = [] }: LoginProps) {
    const { errors } = usePage().props as { errors: Record<string, string> };

    const { data, setData, post, processing } = useForm({
        email: 'ada@example.com',
        password: 'password',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    const handleQuickLogin = (user: User) => {
        router.post(`/switch-user/${user.id}`);
    };

    return (
        <div className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-4 selection:bg-primary/20 selection:text-primary">
            <Head title="Sign In - PillotArk" />

            <div className="w-full max-w-md space-y-6">
                {/* Brand Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex h-12 w-12 rounded-2xl bg-blue-600 text-white items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/20">
                        P
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Welcome to PillotArk
                    </h1>
                    <p className="text-xs text-muted-foreground">
                        Jira-style agile project tracking & team management
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xl space-y-5">
                    {/* Banned / General Error Alert */}
                    {errors.email && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-2.5 text-red-600 text-xs">
                            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                            <div className="leading-relaxed">
                                <span className="font-semibold block">Access Restricted</span>
                                <span>{errors.email}</span>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Email</label>
                            <div className="relative">
                                <Mail className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                                <input
                                    type="email"
                                    required
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="ada@example.com"
                                    className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Password</label>
                            <div className="relative">
                                <Lock className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                                <input
                                    type="password"
                                    required
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
                        >
                            <span>Sign In</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                    </form>

                    {/* Quick Demo Switcher */}
                    <div className="pt-4 border-t border-border/60 space-y-2.5">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center">
                            Instant Demo Sign-in
                        </div>
                        <div className="space-y-2">
                            {users.map((u) => {
                                const isBanned = !!u.banned_at;
                                return (
                                    <button
                                        key={u.id}
                                        type="button"
                                        onClick={() => handleQuickLogin(u)}
                                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                                            isBanned
                                                ? 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10'
                                                : 'border-border/80 bg-background hover:bg-muted/40 hover:border-primary/40'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div
                                                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                                    isBanned
                                                        ? 'bg-red-500/20 text-red-600'
                                                        : 'bg-primary/15 text-primary'
                                                }`}
                                            >
                                                {u.name[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-semibold text-foreground truncate flex items-center gap-1.5">
                                                    <span>{u.name}</span>
                                                    {isBanned && (
                                                        <span className="text-[10px] bg-red-500/15 text-red-600 px-1.5 py-0.2 rounded font-medium">
                                                            Suspended
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground truncate">
                                                    {u.email}
                                                </div>
                                            </div>
                                        </div>

                                        <UserCheck
                                            className={`h-4 w-4 shrink-0 ${
                                                isBanned ? 'text-red-500' : 'text-primary'
                                            }`}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
