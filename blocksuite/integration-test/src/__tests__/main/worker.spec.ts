import { expect, test } from 'vitest';

import { createPainterWorker } from '../utils/setup.js';

test('turbo painter worker boots without runtime error', async () => {
  const worker = createPainterWorker();

  const error = await new Promise<ErrorEvent | null>(resolve => {
    const timer = setTimeout(() => {
      resolve(null);
    }, 100);

    worker.addEventListener('error', event => {
      clearTimeout(timer);
      resolve(event);
    });
  });

  worker.terminate();
  expect(error).toBeNull();
});
