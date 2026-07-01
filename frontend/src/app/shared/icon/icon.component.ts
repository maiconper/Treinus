import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

// Nome de ícone do set em traço definido em design_handoff_treinus_brand (seção 04 · Ícones).
export type IconName =
  | 'home'
  | 'dumbbell'
  | 'bar-chart'
  | 'timer'
  | 'person'
  | 'flame'
  | 'play'
  | 'plus'
  | 'check'
  | 'calendar'
  | 'heart-rate'
  | 'settings';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      [attr.stroke]="color"
      [attr.stroke-width]="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <ng-container [ngSwitch]="name">
        <ng-container *ngSwitchCase="'home'">
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V20h14V9.5" />
          <path d="M9.5 20v-5h5v5" />
        </ng-container>
        <ng-container *ngSwitchCase="'dumbbell'">
          <path d="M4 8v8M7 6v12M17 6v12M20 8v8M7 12h10" />
        </ng-container>
        <ng-container *ngSwitchCase="'bar-chart'">
          <path d="M5 20V13M12 20V8M19 20v-9" />
          <path d="M3 20h18" />
        </ng-container>
        <ng-container *ngSwitchCase="'timer'">
          <path d="M9 2h6" />
          <circle cx="12" cy="14" r="8" />
          <path d="M12 14V9.5M18 8l1.5-1.5" />
        </ng-container>
        <ng-container *ngSwitchCase="'person'">
          <circle cx="12" cy="8" r="4" />
          <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
        </ng-container>
        <ng-container *ngSwitchCase="'flame'">
          <path
            d="M12 3c3 3 4.5 5.5 4.5 8.5A4.5 4.5 0 0 1 12 16a2.5 2.5 0 0 1-2.5-2.5c0-1 .5-2 1.5-2.8C10 12 8.5 12.5 8 14.5A6 6 0 0 0 12 21a6 6 0 0 0 6-6c0-4-2.5-8-6-12Z"
          />
        </ng-container>
        <ng-container *ngSwitchCase="'play'">
          <path d="M7 4.5 19 12 7 19.5Z" />
        </ng-container>
        <ng-container *ngSwitchCase="'plus'">
          <path d="M12 5v14M5 12h14" />
        </ng-container>
        <ng-container *ngSwitchCase="'check'">
          <path d="M4 12.5 10 18.5 20 6.5" />
        </ng-container>
        <ng-container *ngSwitchCase="'calendar'">
          <rect x="3.5" y="5" width="17" height="16" rx="2" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </ng-container>
        <ng-container *ngSwitchCase="'heart-rate'">
          <path d="M3 12.5h4l2-4 3 8 2.5-5 1.5 1h5" />
        </ng-container>
        <ng-container *ngSwitchCase="'settings'">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
        </ng-container>
      </ng-container>
    </svg>
  `,
})
export class IconComponent {
  @Input() name!: IconName;
  @Input() size = 24;
  @Input() color = 'currentColor';
  @Input() strokeWidth = 2;
}
