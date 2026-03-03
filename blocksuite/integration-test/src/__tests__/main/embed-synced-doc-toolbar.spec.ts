import { createDefaultDoc } from '@blocksuite/affine-shared/utils';
import { beforeEach, expect, test } from 'vitest';

import { wait } from '../utils/common.js';
import { setupEditor } from '../utils/setup.js';

type EmbedLinkedDocElement = HTMLElement & {
  convertToEmbed: () => void;
};

type EmbedSyncedDocElement = HTMLElement & {
  convertToCard: () => void;
};

beforeEach(async () => {
  const cleanup = await setupEditor('page');
  return cleanup;
});

const getRootNoteId = () => {
  const rootId = doc.root?.id;
  if (!rootId) {
    throw new Error('Cannot find root block');
  }
  return doc.addBlock('affine:note', {}, rootId);
};

const waitForCondition = async (condition: () => boolean) => {
  for (let i = 0; i < 30; i++) {
    if (condition()) {
      return;
    }
    await wait(50);
  }
  expect(condition()).toBe(true);
};

test('can change linked doc to embed synced doc', async () => {
  const rootNoteId = getRootNoteId();
  const linkedDoc = createDefaultDoc(collection, {
    id: 'toolbar-doc-1',
    title: 'page1',
  });

  doc.addBlock(
    'affine:embed-linked-doc',
    {
      pageId: linkedDoc.id,
    },
    rootNoteId
  );

  await waitForCondition(
    () => !!document.querySelector('affine-embed-linked-doc-block')
  );
  const linkedDocBlock = document.querySelector<EmbedLinkedDocElement>(
    'affine-embed-linked-doc-block'
  );
  if (!linkedDocBlock) {
    throw new Error('Cannot find embed linked doc block');
  }

  linkedDocBlock.convertToEmbed();

  await waitForCondition(
    () =>
      document.querySelectorAll('affine-embed-synced-doc-block').length === 1
  );
  expect(
    document.querySelectorAll('affine-embed-synced-doc-block')
  ).toHaveLength(1);
});

test('can change embed synced doc to card view', async () => {
  const rootNoteId = getRootNoteId();
  const linkedDoc = createDefaultDoc(collection, {
    id: 'toolbar-doc-2',
    title: 'Doc 2',
  });

  doc.addBlock(
    'affine:embed-synced-doc',
    {
      pageId: linkedDoc.id,
      xywh: '[0, 100, 370, 100]',
    },
    rootNoteId
  );

  await waitForCondition(
    () => !!document.querySelector('affine-embed-synced-doc-block')
  );
  const embedSyncedDocBlock = document.querySelector<EmbedSyncedDocElement>(
    'affine-embed-synced-doc-block'
  );
  if (!embedSyncedDocBlock) {
    throw new Error('Cannot find embed synced doc block');
  }

  embedSyncedDocBlock.convertToCard();

  await waitForCondition(
    () =>
      document.querySelectorAll('affine-embed-linked-doc-block').length === 1
  );
  expect(
    document.querySelectorAll('affine-embed-linked-doc-block')
  ).toHaveLength(1);
});
