import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { ProgramService } from '../../core/services/program.service';
import { SessionService } from '../../core/services/session.service';
import { AuthService } from '../../core/services/auth.service';
import { User, Program, Session } from '../../core/models';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  user: User | null = null;
  activeProgram: Program | null = null;
  activeSession: Session | null = null;
  today = new Date();
  loading = true;

  weekDays = [
    { label: 'S', key: 1 },
    { label: 'T', key: 2 },
    { label: 'Q', key: 3 },
    { label: 'Q', key: 4 },
    { label: 'S', key: 5 },
    { label: 'S', key: 6 },
    { label: 'D', key: 0 },
  ];

  constructor(
    private userService: UserService,
    private programService: ProgramService,
    private sessionService: SessionService,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit() { this.load(); }

  ionViewWillEnter() { this.load(); }

  load() {
    this.loading = true;
    forkJoin({
      user: this.userService.getMe(),
      program: this.programService.getActive().pipe(catchError(() => of(null))),
      session: this.sessionService.getCurrent().pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ user, program, session }) => {
        this.user = user;
        this.activeProgram = program;
        this.activeSession = session as Session | null;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  get todayWorkout() {
    if (!this.activeProgram) return null;
    const todayKey = this.today.getDay();
    for (const week of this.activeProgram.weeks) {
      const day = week.days.find(d => d.dayOfWeek === todayKey && !d.restDay);
      if (day) return day;
    }
    return null;
  }

  get programPercent(): number {
    if (!this.activeProgram) return 0;
    // Simplified: based on started weeks
    return 4;
  }

  get greeting(): string {
    const h = this.today.getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  get firstName(): string {
    return this.user?.name?.split(' ')[0] ?? '';
  }

  get userInitials(): string {
    if (!this.user?.name) return '?';
    return this.user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  get formattedDate(): string {
    return this.today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' });
  }

  getDayStatus(key: number): 'done' | 'today' | 'rest' | '' {
    const todayKey = this.today.getDay();
    if (key === todayKey) return 'today';
    if (!this.activeProgram) return '';
    const hasWorkout = this.activeProgram.weeks[0]?.days.some(d => d.dayOfWeek === key && !d.restDay);
    const isRest = this.activeProgram.weeks[0]?.days.some(d => d.dayOfWeek === key && d.restDay);
    if (isRest) return 'rest';
    return '';
  }

  startWorkout() {
    if (this.activeSession) {
      this.router.navigate(['/session', this.activeSession.id]);
    } else if (this.todayWorkout?.workoutId) {
      this.sessionService.start({ workoutId: this.todayWorkout.workoutId }).subscribe(s => {
        this.router.navigate(['/session', s.id]);
      });
    }
  }

  goToPrograms() { this.router.navigate(['/tabs/workouts']); }
}
