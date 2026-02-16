import { Injectable, signal } from '@angular/core';
import { IcdDiagnosis } from '../models/icd.model';
import { Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class IcdModalService {
    private readonly _isOpen = signal(false);
    readonly isOpen = this._isOpen.asReadonly();

    private readonly selectionSubject = new Subject<IcdDiagnosis>();
    readonly selection$ = this.selectionSubject.asObservable();

    open(): void {
        this._isOpen.set(true);
    }

    close(): void {
        this._isOpen.set(false);
    }

    select(diag: IcdDiagnosis): void {
        this.selectionSubject.next(diag);
        this.close();
    }
}
