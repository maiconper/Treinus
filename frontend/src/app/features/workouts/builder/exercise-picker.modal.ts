import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { Exercise } from '../../../core/models';

const FILTER_GROUPS = [
  { label: 'Todos',    category: null },
  { label: 'Peito',   category: 'CHEST' },
  { label: 'Costas',  category: 'BACK' },
  { label: 'Pernas',  category: 'LEGS' },
  { label: 'Ombros',  category: 'SHOULDERS' },
  { label: 'Braços',  category: 'ARMS' },
  { label: 'Core',    category: 'CORE' },
  { label: 'Glúteos', category: 'GLUTES' },
  { label: 'Cardio',  category: 'CARDIO' },
];

@Component({
  selector: 'app-exercise-picker-modal',
  templateUrl: './exercise-picker.modal.html',
  styleUrls: ['./exercise-picker.modal.scss'],
  standalone: false,
})
export class ExercisePickerModal implements OnInit {
  @Input() allExercises: Exercise[] = [];
  @Input() initialAddedIds: string[] = [];
  /** Callback provided by the parent to open config modal and add the exercise. Returns true on success. */
  @Input() onExerciseSelected!: (exercise: Exercise) => Promise<boolean>;

  filterGroups = FILTER_GROUPS;
  selectedCategory: string | null = null;
  searchQuery = '';
  filteredExercises: Exercise[] = [];
  adding = false;

  private addedIds: string[] = [];
  private expandedIds = new Set<string>();

  constructor(
    private modal: ModalController,
    private toastCtrl: ToastController,
  ) {}

  ngOnInit() {
    this.addedIds = [...this.initialAddedIds];
    this.applyFilters();
  }

  selectCategory(category: string | null) {
    this.selectedCategory = category;
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  private applyFilters() {
    const addedSet = new Set(this.addedIds);
    let results = this.allExercises.filter(e => !addedSet.has(e.id));
    if (this.selectedCategory) {
      results = results.filter(e => e.category === this.selectedCategory);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      results = results.filter(e => e.name.toLowerCase().includes(q));
    }
    this.filteredExercises = results;
  }

  async select(exercise: Exercise) {
    if (this.adding) return;
    this.adding = true;
    try {
      const added = await this.onExerciseSelected(exercise);
      if (added) {
        this.addedIds = [...this.addedIds, exercise.id];
        this.applyFilters();
        await this.showSuccessToast(exercise.name);
      }
    } finally {
      this.adding = false;
    }
  }

  private async showSuccessToast(name: string) {
    const toast = await this.toastCtrl.create({
      message: `${name} adicionado ao treino`,
      duration: 2000,
      position: 'top',
      color: 'success',
      icon: 'checkmark-circle-outline',
    });
    await toast.present();
  }

  toggleExpand(id: string, event: Event) {
    event.stopPropagation();
    if (this.expandedIds.has(id)) this.expandedIds.delete(id);
    else this.expandedIds.add(id);
  }

  isExpanded(id: string): boolean {
    return this.expandedIds.has(id);
  }

  getEquipmentLabel(equipment: string): string {
    const map: Record<string, string> = {
      BARBELL: 'Barra', DUMBBELL: 'Halteres', MACHINE: 'Máquina',
      CABLE: 'Cabo', BODYWEIGHT: 'Peso corporal', KETTLEBELL: 'Kettlebell',
      RESISTANCE_BAND: 'Elástico', SMITH_MACHINE: 'Smith', OTHER: 'Cardio',
    };
    return map[equipment] ?? equipment;
  }

  dismiss() {
    const added = this.addedIds.length - this.initialAddedIds.length;
    this.modal.dismiss({ added }, 'cancel');
  }

  getCategoryColor(category: string): string {
    const map: Record<string, string> = {
      CHEST: '#5B8DEF', BACK: '#A78BFA', LEGS: '#34D399', SHOULDERS: '#F59E0B',
      ARMS: '#F97316', CORE: '#EC4899', GLUTES: '#8B5CF6', CARDIO: '#06B6D4',
    };
    return map[category] ?? '#94A3B8';
  }

  getCategoryLabel(category: string): string {
    const map: Record<string, string> = {
      CHEST: 'Peito', BACK: 'Costas', LEGS: 'Pernas', SHOULDERS: 'Ombros',
      ARMS: 'Braços', CORE: 'Core', GLUTES: 'Glúteos', CARDIO: 'Cardio',
      FULL_BODY: 'Corpo todo', CALVES: 'Panturrilha', FOREARMS: 'Antebraço', NECK: 'Pescoço',
    };
    return map[category] ?? category;
  }
}
