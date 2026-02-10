import { Component, input, signal, computed, ChangeDetectionStrategy, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
    selector: 'app-date-selector',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="flex flex-col lg:flex-row gap-6">
            <!-- Calendar Section -->
            <div class="flex-1 space-y-4">
                <!-- Selector Header -->
                <div class="flex items-center justify-between border-2 border-black p-4 bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                    <button type="button" (click)="prevMonth()" class="p-2 hover:bg-slate-50 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    
                    <h4 class="text-sm font-black uppercase tracking-[0.2em] italic">
                        {{ monthLabel() }}
                    </h4>

                    <button type="button" (click)="nextMonth()" class="p-2 hover:bg-slate-50 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                <!-- Calendar Grid -->
                <div class="border-2 border-black bg-white shadow-[8px_8px_0px_rgba(0,0,0,0.1)] overflow-hidden">
                    <div class="grid grid-cols-7 border-b-2 border-black bg-slate-50">
                        @for (day of daysOfWeek; track day) {
                            <div class="p-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center border-r border-slate-100 last:border-0">
                                {{ day }}
                            </div>
                        }
                    </div>

                    <div class="grid grid-cols-7 italic font-['Inter']">
                        @for (day of calendarDays(); track day.date.getTime()) {
                            <button 
                                type="button"
                                (click)="selectDate(day.date)"
                                [disabled]="day.disabled"
                                class="aspect-square flex flex-col items-center justify-center border-r border-b border-slate-100 last:border-r-0 transition-all text-xs font-black relative group overflow-hidden"
                                [class.bg-black]="formatDate(day.date) === internalDate()"
                                [class.text-white]="formatDate(day.date) === internalDate()"
                                [class.bg-slate-50]="!day.isCurrentMonth"
                                [class.opacity-40]="!day.isCurrentMonth && formatDate(day.date) !== internalDate()"
                                [class.hover:bg-cyan-600]="!day.disabled && formatDate(day.date) !== internalDate()"
                                [class.hover:text-white]="!day.disabled && formatDate(day.date) !== internalDate()"
                            >
                                <span [class.opacity-20]="day.disabled" class="z-10">{{ day.date.getDate() }}</span>
                                
                                @if (isToday(day.date) && formatDate(day.date) !== internalDate()) {
                                    <div class="absolute top-2 right-2 w-1.5 h-1.5 bg-cyan-600 rounded-full animate-pulse"></div>
                                }
                                <div class="absolute inset-0 bg-cyan-600 translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out -z-0"></div>
                            </button>
                        }
                    </div>
                </div>
            </div>

            <!-- Time Slots Section -->
            @if (internalDate()) {
            <div class="w-full space-y-4 animate-enter pt-6 border-t-2 border-black lg:border-t-0 lg:pt-0 lg:border-l-2 lg:pl-6">
                <div class="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-3 gap-2">
                    @for (time of availableTimes(); track time.value) {
                        <button 
                            type="button"
                            (click)="selectTime(time.value)"
                            [disabled]="time.disabled"
                            class="p-3 border-2 border-black text-[10px] font-black transition-all hover:bg-cyan-600 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-current"
                            [class.bg-cyan-600]="internalTime() === time.value"
                            [class.text-white]="internalTime() === time.value"
                            [class.shadow-[4px_4px_0px_rgba(0,0,0,0.1)]]="internalTime() !== time.value"
                        >
                            {{ time.label }}
                        </button>
                    }
                </div>
            </div>
            }
        </div>
    `,
    styles: [`
        :host { display: block; }
        button:disabled { cursor: not-allowed !important; background-color: #f8fafc !important; }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DateSelectorComponent),
            multi: true
        }
    ]
})
export class DateSelectorComponent implements ControlValueAccessor {
    // Inputs
    minDate = input<Date | string | null>(null);

    // Internal State Signals
    protected readonly viewDate = signal(new Date());
    protected readonly internalDate = signal<string>(''); // YYYY-MM-DD
    protected readonly internalTime = signal<string>(''); // HH:mm

    // Constants
    protected readonly daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    private readonly months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Computed Time Slots
    protected readonly availableTimes = computed(() => {
        const slots = [];
        const isSelectedDayToday = this.internalDate() === this.formatDate(new Date());
        const now = new Date();
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();

        for (let h = 7; h <= 21; h++) {
            for (let m of ['00', '30']) {
                const hourStr = h.toString().padStart(2, '0');
                const timeValue = `${hourStr}:${m}`;
                const isPast = isSelectedDayToday && (h < currentHour || (h === currentHour && parseInt(m) <= currentMin));

                slots.push({
                    value: timeValue,
                    label: timeValue,
                    disabled: isPast
                });
            }
        }
        return slots;
    });

    // Calendar logic
    protected readonly monthLabel = computed(() => {
        const date = this.viewDate();
        return `${this.months[date.getMonth()]} ${date.getFullYear()}`;
    });

    protected readonly calendarDays = computed(() => {
        const date = this.viewDate();
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const startGrid = new Date(startOfMonth);
        startGrid.setDate(startGrid.getDate() - startGrid.getDay());

        const days = [];
        const temp = new Date(startGrid);
        const minDateVal = this.getNormalizedMinDate();

        while (days.length < 42) {
            const currentTemp = new Date(temp);
            currentTemp.setHours(0, 0, 0, 0);
            days.push({
                date: new Date(temp),
                isCurrentMonth: temp.getMonth() === date.getMonth(),
                disabled: minDateVal ? currentTemp < minDateVal : false
            });
            temp.setDate(temp.getDate() + 1);
        }
        return days;
    });

    // ControlValueAccessor
    private onChange: (value: any) => void = () => { };
    private onTouched: () => void = () => { };

    writeValue(value: any): void {
        if (!value) {
            this.internalDate.set('');
            this.internalTime.set('');
            return;
        }

        if (typeof value === 'object' && value.date) {
            this.internalDate.set(value.date || '');
            this.internalTime.set(value.time || '');
        } else if (typeof value === 'string') {
            this.internalDate.set(value);
        }

        if (this.internalDate()) {
            this.viewDate.set(new Date(this.internalDate() + 'T12:00:00'));
        }
    }

    registerOnChange(fn: (value: any) => void): void { this.onChange = fn; }
    registerOnTouched(fn: () => void): void { this.onTouched = fn; }

    // Logic
    protected selectDate(date: Date): void {
        const formatted = this.formatDate(date);
        this.internalDate.set(formatted);
        this.emitChange();
    }

    protected selectTime(time: string): void {
        this.internalTime.set(time);
        this.emitChange();
    }

    private emitChange(): void {
        this.onChange({
            date: this.internalDate(),
            time: this.internalTime()
        });
        this.onTouched();
    }

    protected prevMonth(): void {
        const current = this.viewDate();
        this.viewDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
    }

    protected nextMonth(): void {
        const current = this.viewDate();
        this.viewDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
    }

    protected formatDate(d: Date): string {
        return d.toISOString().split('T')[0];
    }

    protected isToday(date: Date): boolean {
        return this.formatDate(date) === this.formatDate(new Date());
    }

    private getNormalizedMinDate(): Date | null {
        const min = this.minDate();
        if (!min) return null;
        const d = new Date(min);
        d.setHours(0, 0, 0, 0);
        return d;
    }
}
