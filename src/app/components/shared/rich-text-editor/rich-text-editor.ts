import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="border border-gray-300 rounded-md overflow-hidden flex flex-col bg-white">
      <!-- Toolbar -->
      <div class="flex items-center gap-1 p-1 border-b border-gray-200 bg-gray-50 flex-wrap">
        <button type="button" (click)="execCommand('bold')" class="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Bold">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
        </button>
        <button type="button" (click)="execCommand('italic')" class="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Italic">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
        </button>
        <div class="relative flex items-center group">
           <button type="button" class="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Text Color">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16"/><path d="m6 16 6-12 6 12"/><path d="M8 12h8"/></svg>
            <input type="color" (input)="onColorChange($event)" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full">
          </button>
        </div>
        <button type="button" (click)="execCommand('insertUnorderedList')" class="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Bullet List">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        </button>
        <div class="h-4 w-px bg-gray-300 mx-1"></div>
        <button type="button" (click)="fileInput.click()" class="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Attach File">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
        </button>
        <input #fileInput type="file" multiple (change)="onFileSelected($event)" class="hidden">
      </div>

      <!-- Editable Area -->
      <div 
        #editor
        contenteditable="true"
        (input)="onInput()"
        (blur)="onBlur()"
        class="p-3 min-h-[120px] focus:outline-none text-gray-800 text-sm overflow-y-auto"
        [attr.placeholder]="placeholder"
      ></div>

      <!-- File Previews -->
      <div *ngIf="selectedFiles.length > 0" class="p-2 border-t border-gray-100 flex flex-wrap gap-2 bg-white">
        <div *ngFor="let file of selectedFiles; let i = index" class="flex items-center gap-2 p-1.5 bg-gray-50 border border-gray-200 rounded text-xs group relative">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span class="max-w-[150px] truncate">{{ file.name }}</span>
          <button (click)="removeFile(i)" class="text-gray-400 hover:text-red-500 transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <!-- Footer / Actions -->
      <div class="flex justify-end gap-2 p-2 bg-gray-50 border-t border-gray-200">
        <button 
          *ngIf="showCancel"
          (click)="onCancel.emit()" 
          class="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded transition-colors"
        >
          Cancel
        </button>
        <button 
          (click)="handleSave()" 
          class="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors shadow-sm"
        >
          {{ saveLabel }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    [contenteditable=true]:empty:before {
      content: attr(placeholder);
      color: #9ca3af;
      pointer-events: none;
      display: block;
    }
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class RichTextEditorComponent implements OnChanges {
  @ViewChild('editor') editor!: ElementRef<HTMLDivElement>;
  
  @Input() content: string = '';
  @Input() placeholder: string = 'Add a comment...';
  @Input() saveLabel: string = 'Save';
  @Input() showCancel: boolean = true;
  
  @Output() save = new EventEmitter<{ html: string, files: File[] }>();
  @Output() onCancel = new EventEmitter<void>();

  selectedFiles: File[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['content'] && this.editor) {
      this.editor.nativeElement.innerHTML = this.content || '';
    }
  }

  ngAfterViewInit() {
    this.editor.nativeElement.innerHTML = this.content || '';
  }

  execCommand(command: string, value: string = '') {
    document.execCommand(command, false, value);
    this.editor.nativeElement.focus();
  }

  onColorChange(event: any) {
    this.execCommand('foreColor', event.target.value);
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        this.selectedFiles.push(files[i]);
      }
    }
    event.target.value = ''; // Reset input
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  onInput() {
    // Optional: emit change if needed
  }

  onBlur() {
    // Optional
  }

  handleSave() {
    const html = this.editor.nativeElement.innerHTML;
    this.save.emit({
      html: html,
      files: this.selectedFiles
    });
    // Clear state if requested or handled by parent
  }

  clear() {
    if (this.editor) {
      this.editor.nativeElement.innerHTML = '';
    }
    this.selectedFiles = [];
  }
}
