/**
 * AI Data Analyst - API Endpoint
 * POST /api/ai/analyst
 * Tool-use loop with SSE streaming
 */

import Anthropic from '@anthropic-ai/sdk';
import { ANALYST_SYSTEM_PROMPT, ANALYST_TOOLS } from '@/lib/ai/analyst-tools';
import { executeTool } from '@/lib/ai/tool-executor';
import type { SSEEvent, AnalystRequest } from '@/lib/ai/types';

export const maxDuration = 60; // Vercel timeout

function createSSEStream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController | null = null;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
  });

  function send(event: SSEEvent) {
    if (!controller) return;
    try {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    } catch {
      // Stream might be closed
    }
  }

  function close() {
    if (!controller) return;
    try {
      controller.close();
    } catch {
      // Already closed
    }
  }

  return { stream, send, close };
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  let body: AnalystRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.messages || body.messages.length === 0) {
    return Response.json({ error: 'No messages provided' }, { status: 400 });
  }

  const { stream, send, close } = createSSEStream();

  // Run the tool-use loop in the background
  (async () => {
    try {
      const anthropic = new Anthropic({ apiKey });

      // Build conversation history for Claude
      const conversationMessages: Anthropic.MessageParam[] = body.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Tool-use loop: keep calling Claude until it stops using tools
      let iterations = 0;
      const MAX_ITERATIONS = 8;

      while (iterations < MAX_ITERATIONS) {
        iterations++;

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 4096,
          system: ANALYST_SYSTEM_PROMPT,
          tools: ANALYST_TOOLS,
          messages: conversationMessages,
        });

        // Process response content blocks
        const assistantContent: Anthropic.ContentBlock[] = [];

        for (const block of response.content) {
          assistantContent.push(block);

          if (block.type === 'text') {
            send({ type: 'text', text: block.text });
          }

          if (block.type === 'tool_use') {
            send({ type: 'tool_start', tool: block.name, toolUseId: block.id });

            try {
              const { result, artifact } = await executeTool(block.name, block.input);

              if (artifact) {
                send({ type: 'artifact', artifact });
              }

              send({ type: 'tool_end', toolUseId: block.id });

              // Feed tool result back to Claude
              conversationMessages.push({
                role: 'assistant',
                content: assistantContent,
              });
              conversationMessages.push({
                role: 'user',
                content: [
                  {
                    type: 'tool_result',
                    tool_use_id: block.id,
                    content: result,
                  },
                ],
              });

              // Reset for next iteration - Claude will see tool results
              assistantContent.length = 0;
            } catch (error) {
              send({ type: 'tool_end', toolUseId: block.id });
              send({
                type: 'error',
                error: `Työkalun ${block.name} suoritus epäonnistui: ${error instanceof Error ? error.message : 'tuntematon virhe'}`,
              });

              // Feed error back to Claude so it can handle gracefully
              conversationMessages.push({
                role: 'assistant',
                content: assistantContent,
              });
              conversationMessages.push({
                role: 'user',
                content: [
                  {
                    type: 'tool_result',
                    tool_use_id: block.id,
                    content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    is_error: true,
                  },
                ],
              });
              assistantContent.length = 0;
            }
          }
        }

        // If Claude finished without tool use, we're done
        if (response.stop_reason === 'end_turn') {
          break;
        }

        // If there were tool uses, the loop continues with the results added
      }

      send({ type: 'done' });
    } catch (error) {
      send({
        type: 'error',
        error: error instanceof Error ? error.message : 'Internal server error',
      });
      send({ type: 'done' });
    } finally {
      close();
    }
  })();

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
