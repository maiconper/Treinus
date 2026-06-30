import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProgressService } from '../../core/services/progress.service';
import { ProgressSummary, WorkoutHistoryItem } from '../../core/models';

@Component({
  selector: 'app-progress',
  templateUrl: './progress.page.html',
  styleUrls: ['./progress.page.scss'],
  standalone: false,
})
export class ProgressPage implements OnInit {
  summary: ProgressSummary | null = null;
  history: WorkoutHistoryItem[] = [];
  loading = true;
  hasMore = false;
  private page = 0;

  constructor(private progressService: ProgressService, private router: Router) {}

  ngOnInit() { this.load(); }
  ionViewWillEnter() { this.load(); }

  load() {
    this.loading = true;
    this.page = 0;
    this.progressService.getSummary().subscribe({
      next: s => { this.summary = s; this.loading = false; },
      error: () => { this.loading = false; },
    });
    this.progressService.getHistory(0).subscribe({
      next: h => {
        this.history = h.content;
        this.hasMore = h.number + 1 < h.totalPages;
      },
    });
  }

  loadMore() {
    this.page++;
    this.progressService.getHistory(this.page).subscribe({
      next: h => {
        this.history = [...this.history, ...h.content];
        this.hasMore = h.number + 1 < h.totalPages;
      },
    });
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    if (m < 60) return `${m} min`;
    return `${Math.floor(m / 60)}h ${m % 60}min`;
  }

  formatDate(iso: string): { day: string; month: string } {
    const d = new Date(iso);
    return {
      day: d.getDate().toString(),
      month: d.toLocaleDateString('pt-BR', { month: 'short' }),
    };
  }

  openSession(h: WorkoutHistoryItem) {
    this.router.navigate(['/tabs/progress', h.sessionId]);
  }
}
