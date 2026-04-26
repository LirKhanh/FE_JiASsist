import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IssueHubService {
  private hubConnection: signalR.HubConnection | null = null;
  
  public issueUpdated$ = new Subject<any>();
  public commentAdded$ = new Subject<any>();
  public commentUpdated$ = new Subject<any>();

  constructor() {}

  public startConnection() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('/issueHub') // Adjust URL if necessary
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('SignalR Connection started'))
      .catch(err => console.log('Error while starting connection: ' + err));

    this.hubConnection.on('IssueUpdated', (data) => {
      this.issueUpdated$.next(data);
    });

    this.hubConnection.on('CommentAdded', (data) => {
      this.commentAdded$.next(data);
    });

    this.hubConnection.on('CommentUpdated', (data) => {
      this.commentUpdated$.next(data);
    });
  }

  public joinProject(projectId: string) {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('JoinProject', projectId)
        .catch(err => console.error(err));
    }
  }

  public joinIssue(issueId: string) {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('JoinIssue', issueId)
        .catch(err => console.error(err));
    }
  }

  public stopConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
  }
}
