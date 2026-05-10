import { Response } from "express";

type SseClient = {
  id: string;
  res: Response;
};

const clients = new Map<string, SseClient>();

export function addPostStreamClient(id: string, res: Response) {
  clients.set(id, { id, res });
}

export function removePostStreamClient(id: string) {
  clients.delete(id);
}

export function emitPostCreated(payload: { postId: string }) {
  const data = JSON.stringify({
    ...payload,
    at: new Date().toISOString()
  });

  for (const client of clients.values()) {
    client.res.write(`event: post-created\n`);
    client.res.write(`data: ${data}\n\n`);
  }
}
