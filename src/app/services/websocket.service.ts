import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, IStompSocket, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject } from 'rxjs';

export interface StompMessage {
  destination: string;
  body: any;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private clients = new Map<string, Client>();
  private connected$ = new Map<string, Subject<boolean>>();

  connect(name: string, endpoint: string): Subject<boolean> {
    if (this.clients.has(name)) {
      return this.connected$.get(name)!;
    }

    const status$ = new Subject<boolean>();
    this.connected$.set(name, status$);

    const token = localStorage.getItem('access_token');
    const client = new Client({
      webSocketFactory: () => new SockJS(endpoint) as IStompSocket,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => status$.next(true),
      onDisconnect: () => status$.next(false),
      onStompError: (frame) => console.error('STOMP error', frame)
    });

    client.activate();
    this.clients.set(name, client);
    return status$;
  }

  subscribe(name: string, destination: string, callback: (msg: IMessage) => void): StompSubscription | null {
    const client = this.clients.get(name);
    if (!client?.connected) return null;
    return client.subscribe(destination, callback);
  }

  publish(name: string, destination: string, body: any): void {
    const client = this.clients.get(name);
    if (client?.connected) {
      client.publish({ destination, body: JSON.stringify(body) });
    }
  }

  disconnect(name: string): void {
    const client = this.clients.get(name);
    if (client) {
      client.deactivate();
      this.clients.delete(name);
      this.connected$.get(name)?.complete();
      this.connected$.delete(name);
    }
  }

  ngOnDestroy(): void {
    this.clients.forEach(c => c.deactivate());
  }
}
