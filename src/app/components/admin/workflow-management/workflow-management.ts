import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkflowService, WorkflowStep } from '../../../services/workflow.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-workflow-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleUp {
      from { opacity: 0; transform: scale(0.95) translateY(20px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .animate-backdrop {
      animation: fadeIn 0.2s ease-out forwards;
    }
    .animate-modal {
      animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
  `],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-text-primary">Quản trị Workflow</h2>
          <p class="text-text-secondary mt-1">Cấu hình các bước trong quy trình xử lý của hệ thống.</p>
        </div>
        <button (click)="openModal()" class="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Thêm Bước
        </button>
      </div>

      <!-- Bảng workflow phân theo STT (step) -->
      <div class="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div class="bg-gray-50 px-6 py-4 border-b border-border grid grid-cols-12 gap-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider">
          <div class="col-span-1">STT</div>
          <div class="col-span-11">Các Bước (Workflow Steps)</div>
        </div>
        
        <div class="divide-y divide-border">
          <div *ngIf="steps.length === 0" class="p-10 text-center text-text-secondary">
            {{ isLoading ? 'Đang tải dữ liệu workflow...' : 'Không có dữ liệu workflow.' }}
          </div>

          <div *ngFor="let group of workflowGroups" class="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-gray-50/50 transition-colors">
            <div class="col-span-1 flex items-center">
              <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                {{ group.stepNumber }}
              </span>
            </div>
            
            <div class="col-span-11 flex flex-wrap gap-3">
              <div *ngFor="let item of group.items" 
                (click)="editStep(item)"
                class="flex items-center bg-white border-2 border-border px-4 py-2 rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer group/step relative min-w-[150px]">
                <div [class]="getStepStatusClass(item)" class="w-2.5 h-2.5 rounded-full mr-3 shrink-0"></div>
                <div class="flex flex-col">
                  <label class="text-sm font-bold text-text-primary cursor-pointer leading-tight">{{ item.stepName || item.StepName }}</label>
                  <span class="text-[9px] text-text-secondary uppercase font-medium mt-0.5">{{ item.stepId || item.StepId }}</span>
                </div>
                <div class="ml-auto pl-3">
                   <div [class]="(item.status !== undefined ? item.status : item.Status) ? 'bg-green-500' : 'bg-gray-300'" 
                        class="w-1.5 h-1.5 rounded-full" 
                        [title]="(item.status !== undefined ? item.status : item.Status) ? 'Hoạt động' : 'Tạm dừng'"></div>
                </div>
              </div>

              <button (click)="openModal(group.stepNumber)" class="border-2 border-dashed border-gray-300 rounded-lg px-4 py-2 text-gray-400 hover:border-primary hover:text-primary transition-all text-sm font-medium flex items-center">
                + Thêm
              </button>
            </div>
          </div>
        </div>
      </div>

      
    </div>

    <!-- Modal Thêm/Sửa Bước -->
    <div *ngIf="isModalOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity animate-backdrop" aria-hidden="true" (click)="closeModal()"></div>

        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div class="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-border animate-modal">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 class="text-xl leading-6 font-bold text-text-primary mb-6" id="modal-title">
                  {{ isEditMode ? 'Cập Nhật Bước Workflow' : 'Thêm Bước Workflow Mới' }}
                </h3>
                
                <div class="space-y-4">
                  <!-- ID -->
                  <div>
                    <label class="block text-sm font-bold text-text-secondary mb-1 uppercase tracking-wider">ID</label>
                    <input style="text-transform: uppercase;" type="text" [(ngModel)]="newStep.stepId" [disabled]="isEditMode" placeholder="VD: INPROGRESS, DONE..." 
                      class="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium disabled:bg-gray-100 disabled:cursor-not-allowed">
                  </div>

                  <!-- Tên -->
                  <div>
                    <label class="block text-sm font-bold text-text-secondary mb-1 uppercase tracking-wider">Step Name</label>
                    <input type="text" [(ngModel)]="newStep.stepName" placeholder="VD: Đang thực hiện..." 
                      class="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium">
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <!-- Step -->
                    <div>
                      <label class="block text-sm font-bold text-text-secondary mb-1 uppercase tracking-wider">Step</label>
                      <select [(ngModel)]="newStep.step" class="w-full px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium bg-white">
                        <option *ngFor="let i of [0,1,2,3,4,5,6]" [value]="i"> {{ i }}</option>
                      </select>
                    </div>

                    <!-- Status Toggle -->
                    <div>
                      <label class="block text-sm font-bold text-text-secondary mb-1 uppercase tracking-wider">Trạng thái</label>
                      <div class="flex items-center h-[42px]">
                        <button (click)="newStep.status = !newStep.status" 
                          [class]="newStep.status ? 'bg-primary' : 'bg-gray-300'"
                          class="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ring-offset-2 focus:ring-2 focus:ring-primary/20">
                          <span [class]="newStep.status ? 'translate-x-5' : 'translate-x-0'"
                            class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"></span>
                        </button>
                        <span class="ml-3 text-sm font-medium" [class]="newStep.status ? 'text-primary' : 'text-text-secondary'">
                          {{ newStep.status ? 'Hoạt động' : 'Tạm dừng' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
            <button (click)="saveStep()" [disabled]="isSaving"
              class="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-6 py-2 bg-primary text-base font-bold text-white hover:bg-primary-hover focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 transition-all">
              {{ isSaving ? 'Đang lưu...' : 'Lưu Lại' }}
            </button>
            <button (click)="closeModal()"
              class="mt-3 w-full inline-flex justify-center rounded-lg border border-border shadow-sm px-6 py-2 bg-white text-base font-bold text-text-primary hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all">
              Hủy Bỏ
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class WorkflowManagementComponent implements OnInit {
  steps: WorkflowStep[] = [];
  isLoading: boolean = true;
  isSaving: boolean = false;
  
  // Modal state
  isModalOpen: boolean = false;
  isEditMode: boolean = false;
  newStep: Partial<WorkflowStep> = {
    stepId: '',
    stepName: '',
    step: 0,
    status: true,
    createdAt: new Date(),
    createdBy: '',
    updateAt: new Date(),
    updateBy: '',
    actionType:''
  };

  constructor(
    private notificationService: NotificationService,
    private workflowService: WorkflowService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.workflowService.getWorkflows().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.steps = [...response.data];
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching workflows:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openModal(preselectedStep?: number) {
    this.isEditMode = false;
    this.newStep = {
      stepId: '',
      stepName: '',
      step: preselectedStep,
      status: true,
      createdAt: new Date(),
      createdBy: JSON.parse(localStorage.getItem('user') || '{}')?.userId,
      actionType:'A'
    };
    this.isModalOpen = true;
  }

  editStep(item: any) {
    this.isEditMode = true;
    this.newStep = {
      stepId: item.stepId || item.StepId,
      stepName: item.stepName || item.StepName,
      step: item.step !== undefined ? item.step : item.Step,
      status: item.status !== undefined ? item.status : item.Status,
      updateAt: new Date(),
      updateBy: JSON.parse(localStorage.getItem('user') || '{}')?.userId,
      actionType:'E'
    };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveStep() {
    if (!this.newStep.stepId || !this.newStep.stepName) {
      this.notificationService.info('Vui lòng nhập đầy đủ ID và Step!');
      return;
    }

    this.isSaving = true;
    const request = this.isEditMode 
      ? this.workflowService.saveWorkflow(this.newStep)
      : this.workflowService.saveWorkflow(this.newStep);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.loadData();
           this.notificationService.success(response.message || 'Thực hiện thành công!');
          this.closeModal();
        } else {
          this.notificationService.error('Lỗi: ' + response.message);
        }
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error saving workflow:', error);
         this.notificationService.error('Đã có lỗi xảy ra khi lưu workflow!');
        this.isSaving = false;
      }
    });
  }

  get workflowGroups() {
    if (!this.steps || !Array.isArray(this.steps)) return [];
    const groups: { stepNumber: number; items: any[] }[] = [];
    const getStepValue = (item: any) => item.step !== undefined ? item.step : item.Step;
    
    const uniqueSteps = [...new Set(this.steps.map(s => getStepValue(s)))]
      .filter(s => s !== undefined && s !== null)
      .sort((a, b) => (a as number) - (b as number));
    
    uniqueSteps.forEach(stepNum => {
      groups.push({
        stepNumber: stepNum as number,
        items: this.steps.filter(s => getStepValue(s) === stepNum)
      });
    });
    return groups;
  }

  getStepStatusClass(item: any): string {
    const stepId = (item.stepId || item.StepId || '').toUpperCase();
    if (stepId.includes('REOPEN')) return 'bg-red-500';
    if (stepId.includes('OPEN')) return 'bg-blue-500';
    if (stepId.includes('STOP')) return 'bg-orange-500';
    if (stepId.includes('INPROGRESS')) return 'bg-yellow-500';
    if (stepId.includes('INREVIEW')) return 'bg-purple-500';
    if (stepId.includes('INTESTING')) return 'bg-purple-500';
    if (stepId.includes('BAREVIEW')) return 'bg-cyan-500';
    if (stepId.includes('BATESTING')) return 'bg-cyan-500';
    if (stepId.includes('DONE')) return 'bg-green-500';
    return 'bg-gray-400';
  }
}
