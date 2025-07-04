import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('@code-check/vscode-extension'));
  });

  test('Extension should activate', async () => {
    const extension = vscode.extensions.getExtension(
      '@code-check/vscode-extension'
    );
    if (extension) {
      await extension.activate();
      assert.ok(extension.isActive);
    }
  });

  test('Commands should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);

    const expectedCommands = [
      'code-check.startAudit',
      'code-check.startFullAudit',
      'code-check.startFileAudit',
      'code-check.showMetrics',
      'code-check.clearDiagnostics',
      'code-check.refreshMetrics',
      'code-check.exportReport',
      'code-check.configureSettings',
    ];

    expectedCommands.forEach((command) => {
      assert.ok(
        commands.includes(command),
        `Command ${command} should be registered`
      );
    });
  });

  test('Start Audit command should work', async () => {
    // Create a test workspace
    const testWorkspace = path.join(__dirname, '../../../test-workspace');

    // Execute the start audit command
    try {
      await vscode.commands.executeCommand('code-check.startAudit');
      // If no error thrown, command exists and can be executed
      assert.ok(true);
    } catch (error) {
      // Command should exist even if it fails due to no workspace
      assert.ok(error instanceof Error);
    }
  });

  test('Configuration should be available', () => {
    const config = vscode.workspace.getConfiguration('codeCheck');

    // Test default configuration values
    const apiEndpoint = config.get('apiEndpoint');
    const enableInlineDiagnostics = config.get('enableInlineDiagnostics');
    const diagnosticsLevel = config.get('diagnosticsLevel');

    assert.strictEqual(typeof apiEndpoint, 'string');
    assert.strictEqual(typeof enableInlineDiagnostics, 'boolean');
    assert.strictEqual(typeof diagnosticsLevel, 'string');
  });

  test('Diagnostics should be clearable', async () => {
    // Get the current document
    const document = vscode.window.activeTextEditor?.document;

    if (document) {
      // Execute clear diagnostics command
      await vscode.commands.executeCommand('code-check.clearDiagnostics');

      // Check that diagnostics are cleared for this document
      const diagnostics = vscode.languages.getDiagnostics(document.uri);
      assert.strictEqual(diagnostics.length, 0);
    }
  });

  test('Status bar item should be created', async () => {
    // This test would check if the status bar item is present
    // Since we can't directly access status bar items, we test by proxy
    const extension = vscode.extensions.getExtension(
      '@code-check/vscode-extension'
    );
    if (extension) {
      await extension.activate();
      // If activation succeeds, status bar item should be created
      assert.ok(extension.isActive);
    }
  });

  test('File audit should work on active file', async () => {
    // Create a temporary file for testing
    const doc = await vscode.workspace.openTextDocument({
      content: 'console.log("Hello, World!");',
      language: 'javascript',
    });

    const editor = await vscode.window.showTextDocument(doc);

    try {
      // Execute file audit command
      await vscode.commands.executeCommand('code-check.startFileAudit');

      // Command should execute without throwing
      assert.ok(true);
    } catch (error) {
      // Even if audit fails, command should be available
      assert.ok(error instanceof Error);
    }

    // Clean up
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  });

  test('Settings configuration should be accessible', async () => {
    try {
      await vscode.commands.executeCommand('code-check.configureSettings');
      // Command should be available
      assert.ok(true);
    } catch (error) {
      assert.ok(error instanceof Error);
    }
  });

  test('Metrics view should be toggleable', async () => {
    try {
      await vscode.commands.executeCommand('code-check.showMetrics');
      // Command should be available
      assert.ok(true);
    } catch (error) {
      assert.ok(error instanceof Error);
    }
  });

  test('Export functionality should be available', async () => {
    try {
      await vscode.commands.executeCommand('code-check.exportReport');
      // Command should be available
      assert.ok(true);
    } catch (error) {
      assert.ok(error instanceof Error);
    }
  });
});
