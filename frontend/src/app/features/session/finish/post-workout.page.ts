import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SessionSummary } from '../../../core/models';

@Component({
  selector: 'app-post-workout',
  templateUrl: './post-workout.page.html',
  styleUrls: ['./post-workout.page.scss'],
  standalone: false,
})
export class PostWorkoutPage implements OnInit {
  summary: SessionSummary | null = null;

  constructor(private router: Router) {}

  ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    this.summary = nav?.extras?.state?.['summary'] ?? null;
    if (!this.summary) this.router.navigate(['/tabs/home']);
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    if (m < 60) return `${m} min`;
    return `${Math.floor(m / 60)}h ${m % 60}min`;
  }

  goHome() { this.router.navigate(['/tabs/home']); }
}
