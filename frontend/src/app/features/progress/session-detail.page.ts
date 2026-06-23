import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../core/services/session.service';
import { Session } from '../../core/models';

@Component({
  selector: 'app-session-detail',
  templateUrl: './session-detail.page.html',
  styleUrls: ['./session-detail.page.scss'],
  standalone: false,
})
export class SessionDetailPage implements OnInit {
  session: Session | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private sessionService: SessionService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.sessionService.get(id).subscribe({
      next: s => { this.session = s; this.loading = false; },
      error: err => {
        console.error('[SessionDetail] erro ao carregar sessão:', err);
        this.loading = false;
      },
    });
  }

  goBack() {
    this.location.back();
  }

  get durationSeconds(): number {
    if (!this.session?.startedAt || !this.session.finishedAt) return 0;
    return Math.floor(
      (new Date(this.session.finishedAt).getTime() - new Date(this.session.startedAt).getTime()) / 1000
    );
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    if (m < 60) return `${m} min`;
    return `${Math.floor(m / 60)}h ${m % 60}min`;
  }

  formatDateTime(iso: string): string {
    return new Date(iso).toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }) + ' · ' + new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  registerAnotherWorkout() {
    if (!this.session) return;
    const d = new Date(this.session.startedAt);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    this.router.navigate(['/tabs/workouts/register'], {
      queryParams: { date, workoutId: this.session.workoutId ?? null, workoutName: this.session.workoutName },
    });
  }

  get totalSets(): number {
    return this.session?.exercises
      .filter(e => e.status !== 'SKIPPED')
      .reduce((acc, e) => acc + e.sets.length, 0) ?? 0;
  }
}
