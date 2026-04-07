import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-between px-6 py-3 bg-white border-t border-border">
      <div class="flex flex-1 justify-between sm:hidden">
        <button (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 1"
          class="relative inline-flex items-center px-4 py-2 text-sm font-medium text-text-secondary bg-white border border-border rounded-md hover:bg-gray-50 disabled:opacity-50">
          Trước
        </button>
        <button (click)="goToPage(currentPage + 1)" [disabled]="currentPage === totalPages"
          class="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-text-secondary bg-white border border-border rounded-md hover:bg-gray-50 disabled:opacity-50">
          Sau
        </button>
      </div>
      <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-text-secondary">
            Hiển thị
            <span class="font-bold text-text-primary">{{ startIndex + 1 }}</span>
            đến
            <span class="font-bold text-text-primary">{{ endIndex }}</span>
            trong số
            <span class="font-bold text-text-primary">{{ totalItems }}</span>
            kết quả
          </p>
        </div>
        <div>
          <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 1"
              class="relative inline-flex items-center rounded-l-md px-2 py-2 text-text-secondary ring-1 ring-inset ring-border hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50">
              <span class="sr-only">Previous</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
              </svg>
            </button>
            
            <ng-container *ngFor="let page of pages">
              <button (click)="goToPage(page)" 
                [class]="page === currentPage ? 'z-10 bg-primary text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary' : 'text-text-primary ring-1 ring-inset ring-border hover:bg-gray-50 focus:outline-offset-0'"
                class="relative inline-flex items-center px-4 py-2 text-sm font-semibold">
                {{ page }}
              </button>
            </ng-container>

            <button (click)="goToPage(currentPage + 1)" [disabled]="currentPage === totalPages"
              class="relative inline-flex items-center rounded-r-md px-2 py-2 text-text-secondary ring-1 ring-inset ring-border hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50">
              <span class="sr-only">Next</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class PaginationComponent implements OnChanges {
  @Input() totalItems: number = 0;
  @Input() pageSize: number = 10;
  @Input() currentPage: number = 1;
  @Output() pageChange = new EventEmitter<number>();

  totalPages: number = 0;
  pages: number[] = [];
  startIndex: number = 0;
  endIndex: number = 0;

  ngOnChanges(changes: SimpleChanges): void {
    this.calculatePagination();
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    
    // Limit visible pages if there are too many
    if (this.totalPages > 7) {
        const start = Math.max(1, this.currentPage - 3);
        const end = Math.min(this.totalPages, start + 6);
        const actualStart = Math.max(1, end - 6);
        this.pages = Array.from({ length: end - actualStart + 1 }, (_, i) => i + actualStart);
    }

    this.startIndex = (this.currentPage - 1) * this.pageSize;
    this.endIndex = Math.min(this.startIndex + this.pageSize, this.totalItems);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }
}
