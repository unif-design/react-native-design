import { describe, expect, test } from '@jest/globals';
import {
  EXPECTED,
  assertExactVersion,
  assertRuntimeScreenSafeAreaSource,
  assertRuntimeScreenSafeArea,
  assertLockChecksums,
  assertNoDestinationArgument,
  assertOutsideExample,
  assertTemplateManifest,
  buildNativeTemplateSnapshot,
  buildHarnessManifest,
  buildScaffoldArgs,
  findLockChecksum,
  installHarnessDependencies,
  resolveLockedDependency,
  runWithOwnedTempCleanup,
  assertNativeTemplateSnapshot,
} from '../../scripts/create-runtime-api-harness';

/** 根 package.json 的最小切片 —— 只需要 peerDependencies 与其 meta。 */
const rootManifest = {
  name: '@unif/react-native-design',
  devDependencies: {
    '@babel/core': '^7.29.7',
    '@react-native/metro-config': '0.86.2',
    '@sbaiahmed1/react-native-blur': '^4.6.2',
    'react': '19.2.3',
    'react-native': '0.86.2',
    'react-native-gesture-handler': '^3.1.0',
    'react-native-reanimated': '~4.5.3',
    'react-native-reanimated-carousel': '^5.0.0',
    'react-native-safe-area-context': '^5.7.0',
    'react-native-svg': '^15.15.5',
    'react-native-worklets': '^0.11.3',
  },
  peerDependencies: {
    '@sbaiahmed1/react-native-blur': '>=4',
    'react': '>=19.2.3 <20.0.0',
    'react-native': '>=0.86.0 <0.87.0',
    'react-native-gesture-handler': '>=3.0.0 <4.0.0',
    'react-native-reanimated': '>=4.5.2 <4.6.0',
    'react-native-reanimated-carousel': '>=5.0.0 <6.0.0',
    'react-native-safe-area-context': '>=5',
    'react-native-svg': '>=15',
    'react-native-worklets': '>=0.11.0 <0.12.0',
  },
};

/** 当前 install 解析出的精确 provider 版本 —— 每个非 optional peer 都必须在场。 */
const resolved: Record<string, string> = {
  '@babel/core': '7.29.7',
  '@react-native/metro-config': '0.86.2',
  '@sbaiahmed1/react-native-blur': '4.6.2',
  'react': '19.2.3',
  'react-native': '0.86.2',
  'react-native-gesture-handler': '3.1.0',
  'react-native-reanimated': '4.5.3',
  'react-native-reanimated-carousel': '5.0.0',
  'react-native-safe-area-context': '5.8.0',
  'react-native-svg': '15.15.5',
  'react-native-worklets': '0.11.3',
};

const templateManifest = {
  dependencies: { 'react': '19.2.3', 'react-native': '0.86.2' },
  devDependencies: { '@react-native-community/cli': '20.1.0' },
};

const LOCK = [
  '"@react-native-community/template@npm:0.86.2":',
  '  version: 0.86.2',
  '  resolution: "@react-native-community/template@npm:0.86.2"',
  '  checksum: 10c0/7f6d577c49a98f116d002c39fc246656b1718f36c',
  '  languageName: node',
  '  linkType: hard',
  '',
  '"@react-native-community/cli@npm:20.1.0":',
  '  version: 20.1.0',
  '  resolution: "@react-native-community/cli@npm:20.1.0"',
  '  checksum: 10c0/aaaabbbbccccdddd',
  '  languageName: node',
  '  linkType: hard',
  '',
].join('\n');

const PROVIDER_LOCK = [
  '"@babel/core@npm:^7.29.7":',
  '  version: 7.29.7',
  '  resolution: "@babel/core@npm:7.29.7"',
  '  checksum: 10c0/babel',
  '  languageName: node',
  '  linkType: hard',
  '',
  '"react-native-svg@npm:^15.15.5":',
  '  version: 15.15.5',
  '  resolution: "react-native-svg@npm:15.15.5"',
  '  checksum: 10c0/svg',
  '  languageName: node',
  '  linkType: hard',
  '',
].join('\n');

describe('EXPECTED — 固定版本基线', () => {
  test('CLI / template / React / RN 全部钉死', () => {
    expect(EXPECTED).toEqual({
      cli: '20.1.0',
      template: '0.86.2',
      react: '19.2.3',
      reactNative: '0.86.2',
    });
  });
});

describe('buildScaffoldArgs', () => {
  test('脚手架 argv 同时固定 RN 和本地 template', () => {
    expect(
      buildScaffoldArgs('/installed/template', '/tmp/runtime-123')
    ).toEqual([
      'init',
      'RuntimeApiHarness',
      '--version',
      '0.86.2',
      '--template',
      '/installed/template',
      '--pm',
      'yarn',
      '--directory',
      '/tmp/runtime-123/RuntimeApiHarness',
      '--skip-install',
      '--skip-git-init',
    ]);
  });

  test('目标目录落在 example/ 下时直接抛错', () => {
    expect(() =>
      buildScaffoldArgs('/installed/template', '/repo/example/tmp')
    ).toThrow('example');
  });
});

describe('buildHarnessManifest', () => {
  test('manifest 使用本地 tarball 并完整提供 runtime peers', () => {
    const manifest = buildHarnessManifest(
      rootManifest,
      resolved,
      '/tmp/design.tgz'
    );
    expect(manifest.dependencies).toMatchObject({
      '@unif/react-native-design': 'file:/tmp/design.tgz',
      'react': '19.2.3',
      'react-native': '0.86.2',
      'react-native-gesture-handler': '3.1.0',
      'react-native-reanimated-carousel': '5.0.0',
      'react-native-reanimated': '4.5.3',
      'react-native-worklets': '0.11.3',
    });
    expect(manifest.devDependencies).toMatchObject({
      '@babel/core': '7.29.7',
      '@react-native/metro-config': '0.86.2',
    });
  });

  test('每个非 optional peer 都写进 dependencies,一个不落', () => {
    const manifest = buildHarnessManifest(
      rootManifest,
      resolved,
      '/tmp/design.tgz'
    );
    const deps = manifest.dependencies as Record<string, string>;
    for (const peer of Object.keys(rootManifest.peerDependencies)) {
      expect(deps[peer]).toBe(resolved[peer]);
    }
    expect(Object.keys(deps)).toHaveLength(
      Object.keys(rootManifest.peerDependencies).length + 1
    );
  });

  test.each(Object.keys(rootManifest.peerDependencies))(
    '缺少 provider %s 时抛错并点名该 peer',
    (peer) => {
      const partial = { ...resolved };
      delete partial[peer];
      expect(() =>
        buildHarnessManifest(rootManifest, partial, '/tmp/design.tgz')
      ).toThrow(peer);
    }
  );

  test('provider 版本不是精确版本时抛错', () => {
    expect(() =>
      buildHarnessManifest(
        rootManifest,
        { ...resolved, 'react-native-svg': '^15.15.5' },
        '/tmp/design.tgz'
      )
    ).toThrow('react-native-svg');
  });

  test('optional peer 缺 provider 不算错误', () => {
    const withOptional = {
      ...rootManifest,
      peerDependencies: {
        ...rootManifest.peerDependencies,
        'react-native-optional': '*',
      },
      peerDependenciesMeta: { 'react-native-optional': { optional: true } },
    };
    const manifest = buildHarnessManifest(
      withOptional,
      resolved,
      '/tmp/design.tgz'
    );
    expect(
      (manifest.dependencies as Record<string, string>)['react-native-optional']
    ).toBeUndefined();
  });
});

describe('resolveLockedDependency — direct descriptor / locator / install / peer 闭环', () => {
  test('从根 direct range 对应的精确 locator 解析 provider', () => {
    expect(
      resolveLockedDependency(
        rootManifest,
        PROVIDER_LOCK,
        { 'react-native-svg': '15.15.5' },
        'react-native-svg',
        rootManifest.peerDependencies['react-native-svg']
      )
    ).toBe('15.15.5');
  });

  test('descriptor 块指向错误 package locator 时 fail-fast', () => {
    const wrongLocator = PROVIDER_LOCK.replace(
      'resolution: "react-native-svg@npm:15.15.5"',
      'resolution: "react-native-safe-area-context@npm:15.15.5"'
    );
    expect(() =>
      resolveLockedDependency(
        rootManifest,
        wrongLocator,
        { 'react-native-svg': '15.15.5' },
        'react-native-svg',
        rootManifest.peerDependencies['react-native-svg']
      )
    ).toThrow('locator');
  });

  test('lock locator 不满足根 direct range 时 fail-fast', () => {
    const outsideDirectRange = PROVIDER_LOCK.replace(
      'version: 15.15.5',
      'version: 14.0.0'
    ).replace(
      'resolution: "react-native-svg@npm:15.15.5"',
      'resolution: "react-native-svg@npm:14.0.0"'
    );
    expect(() =>
      resolveLockedDependency(
        rootManifest,
        outsideDirectRange,
        { 'react-native-svg': '14.0.0' },
        'react-native-svg',
        rootManifest.peerDependencies['react-native-svg']
      )
    ).toThrow('direct range');
  });

  test('lock locator 不满足根 peer range 时 fail-fast', () => {
    const manifest = {
      devDependencies: { 'react-native-svg': '^14.0.0' },
      peerDependencies: { 'react-native-svg': '>=15' },
    };
    const lock = PROVIDER_LOCK.replaceAll('^15.15.5', '^14.0.0').replaceAll(
      '15.15.5',
      '14.0.0'
    );
    expect(() =>
      resolveLockedDependency(
        manifest,
        lock,
        { 'react-native-svg': '14.0.0' },
        'react-native-svg',
        '>=15'
      )
    ).toThrow('peer range');
  });

  test('installed version 与 lock locator 漂移时 fail-fast', () => {
    expect(() =>
      resolveLockedDependency(
        rootManifest,
        PROVIDER_LOCK,
        { 'react-native-svg': '15.15.4' },
        'react-native-svg',
        rootManifest.peerDependencies['react-native-svg']
      )
    ).toThrow('installed');
  });
});

describe('installHarnessDependencies — 临时 lock bootstrap + immutable 复验', () => {
  test('先生成临时 lockfile，再用相同 Yarn 执行 immutable install', () => {
    const calls: Array<{
      command: string;
      args: readonly string[];
      cwd: string;
    }> = [];
    let lockExists = false;
    installHarnessDependencies('/tmp/runtime-app', '/tmp/yarn-4.11.0.cjs', {
      nodePath: '/usr/local/bin/node',
      execute(command, args, cwd) {
        calls.push({ command, args, cwd });
        lockExists = true;
      },
      exists(file) {
        expect(file).toBe('/tmp/runtime-app/yarn.lock');
        return lockExists;
      },
    });
    expect(calls).toEqual([
      {
        command: '/usr/local/bin/node',
        args: ['/tmp/yarn-4.11.0.cjs', 'install'],
        cwd: '/tmp/runtime-app',
      },
      {
        command: '/usr/local/bin/node',
        args: ['/tmp/yarn-4.11.0.cjs', 'install', '--immutable'],
        cwd: '/tmp/runtime-app',
      },
    ]);
  });

  test('bootstrap 未生成 lockfile 时不运行 immutable install', () => {
    const calls: string[][] = [];
    expect(() =>
      installHarnessDependencies('/tmp/runtime-app', '/tmp/yarn.cjs', {
        nodePath: '/usr/local/bin/node',
        execute(_command, args) {
          calls.push([...args]);
        },
        exists() {
          return false;
        },
      })
    ).toThrow('yarn.lock');
    expect(calls).toEqual([['/tmp/yarn.cjs', 'install']]);
  });
});

describe('native template snapshot — 从 installed template 捕获版本特征', () => {
  const templateFiles = {
    'ios/Podfile': "target 'HelloWorld' do\n  use_react_native!\nend\n",
    'android/settings.gradle':
      "plugins { id('com.facebook.react.settings') }\nrootProject.name = 'HelloWorld'\n",
    'android/build.gradle':
      'ext { compileSdkVersion = 36 }\napply plugin: "com.facebook.react.rootproject"\n',
    'android/app/build.gradle':
      'namespace "com.helloworld"\ntargetSdkVersion rootProject.ext.targetSdkVersion\n',
  };

  test('只接受与 template 内容及 app-name 替换一致的生成文件', () => {
    const snapshot = buildNativeTemplateSnapshot(templateFiles);
    expect(() =>
      assertNativeTemplateSnapshot(snapshot, {
        'ios/Podfile':
          "target 'RuntimeApiHarness' do\n  use_react_native!\nend\n",
        'android/settings.gradle':
          "plugins { id('com.facebook.react.settings') }\nrootProject.name = 'RuntimeApiHarness'\n",
        'android/build.gradle':
          'ext { compileSdkVersion = 36 }\napply plugin: "com.facebook.react.rootproject"\n',
        'android/app/build.gradle':
          'namespace "com.runtimeapiharness"\ntargetSdkVersion rootProject.ext.targetSdkVersion\n',
      })
    ).not.toThrow();
  });

  test('仍含通用 RN marker 但偏离 installed template 时 fail-fast', () => {
    const snapshot = buildNativeTemplateSnapshot(templateFiles);
    expect(() =>
      assertNativeTemplateSnapshot(snapshot, {
        'ios/Podfile':
          "target 'RuntimeApiHarness' do\n  use_react_native!\n  pod 'Unexpected'\nend\n",
        'android/settings.gradle':
          "plugins { id('com.facebook.react.settings') }\nrootProject.name = 'RuntimeApiHarness'\n",
        'android/build.gradle':
          'ext { compileSdkVersion = 35 }\napply plugin: "com.facebook.react.rootproject"\n',
        'android/app/build.gradle':
          'namespace "com.runtimeapiharness"\ntargetSdkVersion rootProject.ext.targetSdkVersion\n',
      })
    ).toThrow('template');
  });
});

describe('runWithOwnedTempCleanup', () => {
  test('scaffold 后任一步失败都会删除精确 owned parent', () => {
    const removed: string[] = [];
    expect(() =>
      runWithOwnedTempCleanup(
        '/tmp/unif-runtime-api-red',
        () => {
          throw new Error('post-scaffold failure');
        },
        {
          tempRoot: '/tmp',
          remove(target) {
            removed.push(target);
          },
        }
      )
    ).toThrow('post-scaffold failure');
    expect(removed).toEqual(['/tmp/unif-runtime-api-red']);
  });

  test('完整流程成功时保留 owned parent', () => {
    const removed: string[] = [];
    runWithOwnedTempCleanup('/tmp/unif-runtime-api-green', () => {}, {
      tempRoot: '/tmp',
      remove(target) {
        removed.push(target);
      },
    });
    expect(removed).toEqual([]);
  });

  test('TMPDIR 含 example 时路径断言失败也会清理 owned parent', () => {
    const parent = '/tmp/example/unif-runtime-api-red';
    const removed: string[] = [];
    let operationRan = false;
    expect(() =>
      runWithOwnedTempCleanup(
        parent,
        () => {
          operationRan = true;
        },
        {
          tempRoot: '/tmp/example',
          remove(target) {
            removed.push(target);
          },
        }
      )
    ).toThrow('example');
    expect(operationRan).toBe(false);
    expect(removed).toEqual([parent]);
  });
});

describe('assertExactVersion — CLI / template 漂移', () => {
  test('版本一致时通过', () => {
    expect(() =>
      assertExactVersion('@react-native-community/cli', '20.1.0', EXPECTED.cli)
    ).not.toThrow();
  });

  test.each([
    ['@react-native-community/cli', '20.1.3', EXPECTED.cli],
    ['@react-native-community/template', '0.86.3', EXPECTED.template],
  ])('%s 漂移到 %s 时抛错', (name, actual, expectedVersion) => {
    expect(() => assertExactVersion(name, actual, expectedVersion)).toThrow(
      name
    );
  });
});

describe('assertTemplateManifest — template 的 React / RN 漂移', () => {
  test('template 声明的 React / RN 与基线一致时通过', () => {
    expect(() => assertTemplateManifest(templateManifest)).not.toThrow();
  });

  test('template 的 react 漂移时抛错', () => {
    expect(() =>
      assertTemplateManifest({
        ...templateManifest,
        dependencies: { ...templateManifest.dependencies, react: '19.3.0' },
      })
    ).toThrow('react');
  });

  test('template 的 react-native 漂移时抛错', () => {
    expect(() =>
      assertTemplateManifest({
        ...templateManifest,
        dependencies: {
          ...templateManifest.dependencies,
          'react-native': '0.87.0',
        },
      })
    ).toThrow('react-native');
  });

  test('template 内置 CLI 漂移时抛错', () => {
    expect(() =>
      assertTemplateManifest({
        ...templateManifest,
        devDependencies: { '@react-native-community/cli': '20.1.3' },
      })
    ).toThrow('@react-native-community/cli');
  });
});

describe('assertLockChecksums — 锁文件完整性', () => {
  test('两个包都有非空 checksum 时通过', () => {
    expect(() =>
      assertLockChecksums(LOCK, [
        { name: '@react-native-community/template', version: '0.86.2' },
        { name: '@react-native-community/cli', version: '20.1.0' },
      ])
    ).not.toThrow();
  });

  test('锁文件里找不到条目时抛错', () => {
    expect(() =>
      assertLockChecksums(LOCK, [
        { name: '@react-native-community/template', version: '0.86.3' },
      ])
    ).toThrow('@react-native-community/template');
  });

  test('checksum 为空时抛错', () => {
    const broken = LOCK.replace(
      '  checksum: 10c0/7f6d577c49a98f116d002c39fc246656b1718f36c',
      '  checksum: '
    );
    expect(() =>
      assertLockChecksums(broken, [
        { name: '@react-native-community/template', version: '0.86.2' },
      ])
    ).toThrow('@react-native-community/template');
  });

  test('findLockChecksum 只在对应条目块内查找,不串块', () => {
    expect(
      findLockChecksum(LOCK, '@react-native-community/cli', '20.1.0')
    ).toBe('10c0/aaaabbbbccccdddd');
    expect(findLockChecksum(LOCK, 'not-installed', '1.0.0')).toBeNull();
  });
});

describe('assertNoDestinationArgument — 不接受调用方指定目录', () => {
  test('无额外参数时通过', () => {
    expect(() => assertNoDestinationArgument([])).not.toThrow();
  });

  test('传入任何目标目录都抛错', () => {
    expect(() => assertNoDestinationArgument(['/somewhere/else'])).toThrow();
    expect(() => assertNoDestinationArgument(['--directory', '/x'])).toThrow();
  });
});

describe('assertOutsideExample — 绝不碰 legacy example shell', () => {
  test('系统临时目录通过', () => {
    expect(() =>
      assertOutsideExample('/var/folders/xy/unif-runtime-api-abc')
    ).not.toThrow();
  });

  test.each([
    '/repo/example',
    '/repo/example/ios',
    'example/android/app',
    './example',
  ])('%s 抛错', (target) => {
    expect(() => assertOutsideExample(target)).toThrow('example');
  });

  test('名字里带 example 但不是该目录的路径不误伤', () => {
    expect(() => assertOutsideExample('/tmp/examples-of-things')).not.toThrow();
  });
});

describe('Runtime API screen safe-area contract', () => {
  test('内容 ScrollView 消费 inset,全屏 Hosts 保持在 SafeAreaView 外', () => {
    expect(() => assertRuntimeScreenSafeArea()).not.toThrow();
  });

  const source = `
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export function RuntimeApiScreen() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView />
        </SafeAreaView>
        <ConfirmHost />
        <ToastHost />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
});
`;

  test('即使仍保留 SafeAreaProvider import,删除 Provider JSX 时拒绝', () => {
    const withoutProvider = source.replace('<SafeAreaProvider>', '');
    expect(() => assertRuntimeScreenSafeAreaSource(withoutProvider)).toThrow(
      'SafeAreaProvider'
    );
  });

  test('SafeAreaProvider 未包住 Theme 和 Hosts 时拒绝', () => {
    const providerOnlyWrapsContent = source
      .replace(
        '<SafeAreaProvider>\n      <ThemeProvider>',
        '<ThemeProvider>\n      <SafeAreaProvider>'
      )
      .replace(
        '</SafeAreaView>\n        <ConfirmHost />',
        '</SafeAreaView>\n      </SafeAreaProvider>\n        <ConfirmHost />'
      )
      .replace('</ThemeProvider>\n    </SafeAreaProvider>', '</ThemeProvider>');
    expect(() =>
      assertRuntimeScreenSafeAreaSource(providerOnlyWrapsContent)
    ).toThrow('SafeAreaProvider');
  });
});
