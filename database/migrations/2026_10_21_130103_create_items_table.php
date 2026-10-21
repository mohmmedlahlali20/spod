<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('folder_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('items')->cascadeOnDelete();
            $table->string('code')->unique()->index();
            $table->string('title');
            $table->longText('description')->nullable();
            $table->string('status')->default('Backlog');
            $table->string('priority')->default('normal'); // urgent, high, normal, low
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('creator_id')->constrained('users');
            $table->date('start_date')->nullable();
            $table->date('due_date')->nullable();
            $table->dateTime('deadline')->nullable();
            $table->string('size')->nullable();
            $table->string('impact')->nullable();
            $table->json('fields_data')->nullable();
            $table->integer('order_index')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
