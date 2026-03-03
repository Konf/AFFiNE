import {
  DatabaseBlockDataSource,
  databaseBlockProperties,
} from '@blocksuite/affine/blocks/database';
import type { DatabaseBlockModel } from '@blocksuite/affine/model';
import { Text } from '@blocksuite/store';
import { beforeEach, expect, test } from 'vitest';

import { wait } from '../utils/common.js';
import { setupEditor } from '../utils/setup.js';

type TableViewWithStats = {
  propertyGetOrCreate: (propertyId: string) => {
    updateStatCalcOp: (type?: string) => void;
  };
};

type StatsCellElement = HTMLElement & {
  column?: {
    id: string;
  };
};

beforeEach(async () => {
  const cleanup = await setupEditor('page');
  return cleanup;
});

const getTableView = (
  dataSource: DatabaseBlockDataSource
): TableViewWithStats => {
  const view = dataSource.viewManager.currentView$.value;
  if (!view) {
    throw new Error('Cannot find current table view');
  }
  return view as unknown as TableViewWithStats;
};

const createDatabase = () => {
  const rootId = doc.root?.id;
  if (!rootId) {
    throw new Error('Cannot find root block');
  }

  const noteId = doc.addBlock('affine:note', {}, rootId);
  const databaseId = doc.addBlock(
    'affine:database',
    {
      title: new Text('Database 1'),
    },
    noteId
  );
  const database = doc.getBlock(databaseId)?.model as
    | DatabaseBlockModel
    | undefined;
  if (!database) {
    throw new Error('Cannot find database model');
  }

  const dataSource = new DatabaseBlockDataSource(database);
  dataSource.viewManager.viewAdd('table');

  const rowIds = Array.from({ length: 3 }, () => dataSource.rowAdd('end'));
  const firstRowId = rowIds[0];
  if (!firstRowId) {
    throw new Error('Cannot find first row');
  }

  return {
    dataSource,
    firstRowId,
  };
};

const findStatsCell = (columnId: string): StatsCellElement | undefined => {
  return Array.from(
    document.querySelectorAll<StatsCellElement>(
      'affine-database-column-stats-cell'
    )
  ).find(cell => cell.column?.id === columnId);
};

const getStatsValue = (columnId: string): string | null => {
  const cell = findStatsCell(columnId);
  return cell?.querySelector('.value')?.textContent?.trim() ?? null;
};

const expectStatsValue = async (columnId: string, expected: string) => {
  for (let i = 0; i < 20; i++) {
    if (getStatsValue(columnId) === expected) {
      return;
    }
    await wait(50);
  }
  expect(getStatsValue(columnId)).toBe(expected);
};

test('title empty count', async () => {
  const { dataSource, firstRowId } = createDatabase();
  const titleColumnId = dataSource.properties$.value.find(
    id => dataSource.propertyTypeGet(id) === 'title'
  );
  if (!titleColumnId) {
    throw new Error('Cannot find title column');
  }

  getTableView(dataSource)
    .propertyGetOrCreate(titleColumnId)
    .updateStatCalcOp('count-empty');
  await expectStatsValue(titleColumnId, '3');

  dataSource.cellValueChange(firstRowId, titleColumnId, 'asd');
  await expectStatsValue(titleColumnId, '2');
});

test('rich-text empty count', async () => {
  const { dataSource, firstRowId } = createDatabase();
  const richTextColumnId = dataSource.propertyAdd('end', {
    type: databaseBlockProperties.richTextColumnConfig.type,
    name: 'Text',
  });
  if (!richTextColumnId) {
    throw new Error('Cannot create rich-text column');
  }

  getTableView(dataSource)
    .propertyGetOrCreate(richTextColumnId)
    .updateStatCalcOp('count-empty');
  await expectStatsValue(richTextColumnId, '3');

  dataSource.cellValueChange(firstRowId, richTextColumnId, new Text('asd'));
  await expectStatsValue(richTextColumnId, '2');
});

test('select empty count', async () => {
  const { dataSource, firstRowId } = createDatabase();
  const selectColumnId = dataSource.propertyAdd('end', {
    type: databaseBlockProperties.selectColumnConfig.type,
    name: 'Select',
  });
  if (!selectColumnId) {
    throw new Error('Cannot create select column');
  }

  getTableView(dataSource)
    .propertyGetOrCreate(selectColumnId)
    .updateStatCalcOp('count-empty');
  await expectStatsValue(selectColumnId, '3');

  dataSource.cellValueChange(firstRowId, selectColumnId, 'select-option');
  await expectStatsValue(selectColumnId, '2');
});
