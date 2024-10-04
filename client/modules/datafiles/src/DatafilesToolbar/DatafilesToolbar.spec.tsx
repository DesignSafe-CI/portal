import { getToolbarRules } from './DatafilesToolbar';
import { TFileListing } from '@client/hooks';

export const fileFixtures = {
  txtFile: {
    system: 'project-9876543210668535791-242ac118-0001-012',
    name: 'test.txt',
    path: '/test.txt',
    format: 'raw',
    type: 'file',
    mimeType: 'text/plain',
    lastModified: '2024-10-03T19:44:11Z',
    length: 52428800,
    permissions: 'READ',
  } as TFileListing,

  anotherTxtFile: {
    system: 'project-9876543210668535791-242ac118-0001-012',
    name: 'another_test.txt',
    path: '/another_test.txt',
    format: 'raw',
    type: 'file',
    mimeType: 'text/plain',
    lastModified: '2024-10-03T19:44:11Z',
    length: 52428800,
    permissions: 'READ',
  } as TFileListing,

  hazmapperFile: {
    system: 'project-9876543210668535791-242ac118-0001-012',
    name: 'test.hazmapper',
    path: '/test.hazmapper',
    format: 'raw',
    type: 'file',
    mimeType: '',
    lastModified: '2024-10-04T00:50:22Z',
    length: 0,
    permissions: 'READ',
  } as TFileListing,

  subDirectory: {
    system: 'project-9876543210668535791-242ac118-0001-012',
    name: 'test',
    path: '/test',
    format: 'folder',
    type: 'dir',
    mimeType: '',
    lastModified: '2024-10-03T19:44:51Z',
    length: 4096,
    permissions: 'READ',
  } as TFileListing,
};

describe('getToolbarRules', () => {
  const USER_WORK_SYSTEM = 'user_work_system';

  test('should disable all buttons when no files are selected', () => {
    const selectedFiles: TFileListing[] = [];
    const isAuthenticated = true;
    const isReadOnly = false;
    const system = 'other_system';

    const rules = getToolbarRules(
      selectedFiles,
      isReadOnly,
      isAuthenticated,
      system,
      USER_WORK_SYSTEM
    );

    expect(rules.canPreview).toBe(false);
    expect(rules.canRename).toBe(false);
    expect(rules.canCopy).toBe(false);
    expect(rules.canMove).toBe(false);
    expect(rules.canTrash).toBe(false);
    expect(rules.canDownload).toBe(false);
  });

  test('should enable all buttons when single "normal" file selected', () => {
    const selectedFiles: TFileListing[] = [fileFixtures.txtFile];

    const isAuthenticated = true;
    const isReadOnly = false;
    const system = 'other_system';

    const rules = getToolbarRules(
      selectedFiles,
      isReadOnly,
      isAuthenticated,
      system,
      USER_WORK_SYSTEM
    );

    expect(rules.canPreview).toBe(true);
    expect(rules.canRename).toBe(true);
    expect(rules.canCopy).toBe(true);
    expect(rules.canMove).toBe(true);
    expect(rules.canTrash).toBe(true);
    expect(rules.canDownload).toBe(true);
  });

  test('should disable all buttons except preview when single hazmapper file selected', () => {
    const selectedFiles: TFileListing[] = [fileFixtures.hazmapperFile];

    const isAuthenticated = true;
    const isReadOnly = false;
    const system = 'other_system';

    const rules = getToolbarRules(
      selectedFiles,
      isReadOnly,
      isAuthenticated,
      system,
      USER_WORK_SYSTEM
    );

    expect(rules.canPreview).toBe(true);
    expect(rules.canRename).toBe(false);
    expect(rules.canCopy).toBe(false);
    expect(rules.canMove).toBe(false);
    expect(rules.canTrash).toBe(false);
    expect(rules.canDownload).toBe(false);
  });

  test('should enable all buttons except rename + preview when multiple "normal" files selected', () => {
    const selectedFiles: TFileListing[] = [
      fileFixtures.txtFile,
      fileFixtures.anotherTxtFile,
    ];

    const isAuthenticated = true;
    const isReadOnly = false;
    const system = 'other_system';

    const rules = getToolbarRules(
      selectedFiles,
      isReadOnly,
      isAuthenticated,
      system,
      USER_WORK_SYSTEM
    );

    expect(rules.canPreview).toBe(false);
    expect(rules.canRename).toBe(false);
    expect(rules.canCopy).toBe(true);
    expect(rules.canMove).toBe(true);
    expect(rules.canTrash).toBe(true);
    expect(rules.canDownload).toBe(true);
  });

  test('should disable all buttons when a .hazmapper file is part of multiple selection', () => {
    const selectedFiles: TFileListing[] = [
      fileFixtures.txtFile,
      fileFixtures.hazmapperFile,
    ];

    const isAuthenticated = true;
    const isReadOnly = false;
    const system = 'other_system';

    const rules = getToolbarRules(
      selectedFiles,
      isReadOnly,
      isAuthenticated,
      system,
      USER_WORK_SYSTEM
    );

    expect(rules.canPreview).toBe(false);
    expect(rules.canRename).toBe(false);
    expect(rules.canCopy).toBe(false);
    expect(rules.canMove).toBe(false);
    expect(rules.canTrash).toBe(false);
    expect(rules.canDownload).toBe(false);
  });

  test('should disable all buttons except preview/download when single selection but not authenticated', () => {
    const selectedFiles: TFileListing[] = [fileFixtures.txtFile];

    const isAuthenticated = false;
    const isReadOnly = false;
    const system = 'other_system';

    const rules = getToolbarRules(
      selectedFiles,
      isReadOnly,
      isAuthenticated,
      system,
      USER_WORK_SYSTEM
    );

    expect(rules.canPreview).toBe(true);
    expect(rules.canRename).toBe(false);
    expect(rules.canCopy).toBe(false);
    expect(rules.canMove).toBe(false);
    expect(rules.canTrash).toBe(false);
    expect(rules.canDownload).toBe(true);
  });

  test('should disable all buttons except download when multiple selection but not authenticated', () => {
    const selectedFiles: TFileListing[] = [
      fileFixtures.txtFile,
      fileFixtures.anotherTxtFile,
    ];

    const isAuthenticated = false;
    const isReadOnly = false;
    const system = 'other_system';

    const rules = getToolbarRules(
      selectedFiles,
      isReadOnly,
      isAuthenticated,
      system,
      USER_WORK_SYSTEM
    );

    expect(rules.canPreview).toBe(false);
    expect(rules.canRename).toBe(false);
    expect(rules.canCopy).toBe(false);
    expect(rules.canMove).toBe(false);
    expect(rules.canTrash).toBe(false);
    expect(rules.canDownload).toBe(true);
  });
});
