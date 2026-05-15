import { Command } from 'commander';
import { apiGet, downloadFile } from '../core/api.js';
import { t } from '../core/i18n.js';
import { printJSON } from '../core/output.js';
import type { OutputOptions } from '../core/output.js';
import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface ApiContent {
  id: string;
  parentId?: string;
  title: string;
  position: number;
  contentHandler: { id: string; file?: { fileName?: string } };
  hasChildren?: boolean;
  links?: { href: string; rel: string; title?: string; type?: string }[];
}

interface TreeNode {
  item: ApiContent;
  children: TreeNode[];
}

function getType(handlerId: string): string {
  switch (handlerId) {
    case 'resource/x-bb-folder': return t('materials.folder');
    case 'resource/x-bb-file': return t('materials.file');
    case 'resource/x-bb-document': return t('materials.document');
    case 'resource/x-bb-externallink': return t('materials.link');
    case 'resource/x-bb-assignment': return t('materials.assignment');
    default: return t('materials.unknown');
  }
}

function buildTree(items: ApiContent[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  for (const item of items) {
    map.set(item.id, { item, children: [] });
  }
  const roots: TreeNode[] = [];
  for (const node of map.values()) {
    if (node.item.parentId && map.has(node.item.parentId)) {
      map.get(node.item.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  for (const node of map.values()) {
    node.children.sort((a, b) => a.item.position - b.item.position);
  }
  roots.sort((a, b) => a.item.position - b.item.position);
  return roots;
}

function printTree(nodes: TreeNode[], prefix = ''): void {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const isLast = i === nodes.length - 1;
    const branch = isLast ? '└── ' : '├── ';
    const type = getType(node.item.contentHandler.id);
    const fileName = node.item.contentHandler.file?.fileName;
    const label = fileName ? `${node.item.title} (${fileName})` : node.item.title;
    console.log(`${prefix}${branch}[${type}] ${label} (${node.item.id})`);
    if (node.children.length > 0) {
      const ext = isLast ? '    ' : '│   ';
      printTree(node.children, prefix + ext);
    }
  }
}

async function resolveDownloadUrl(courseId: string, contentId: string): Promise<string | null> {
  try {
    const attachments = await apiGet(`/learn/api/public/v1/courses/${courseId}/contents/${contentId}/attachments`) as { results: { id: string; fileName: string; mimeType: string }[] };
    if (attachments.results.length === 0) return null;
    const att = attachments.results[0];
    return `/learn/api/public/v1/courses/${courseId}/contents/${contentId}/attachments/${att.id}/download`;
  } catch {
    return null;
  }
}

async function fetchAllContents(courseId: string): Promise<ApiContent[]> {
  // First: fetch top-level contents without recursive=true (some courses forbid it)
  const top = await apiGet(`/learn/api/public/v1/courses/${courseId}/contents?limit=100`) as { results: ApiContent[] };
  const all: ApiContent[] = [...top.results];
  const folders = top.results.filter(c => c.hasChildren && c.contentHandler?.id === 'resource/x-bb-folder');

  // Then: BFS fetch children for each folder
  const queue = folders.map(f => f.id);
  while (queue.length > 0) {
    const pid = queue.shift()!;
    try {
      const children = await apiGet(`/learn/api/public/v1/courses/${courseId}/contents/${pid}/children?limit=100`) as { results: ApiContent[] };
      for (const c of children.results) {
        all.push(c);
        if (c.hasChildren && c.contentHandler?.id === 'resource/x-bb-folder') {
          queue.push(c.id);
        }
      }
    } catch (e) {
      // Some folders may not have accessible children, skip
    }
  }

  return all;
}

export function registerMaterials(program: Command): void {
  program
    .command('materials <course-id>')
    .description('List course materials')
    .option('--json', 'Output as JSON')
    .option('--download <content-id>', 'Download specific file')
    .action(async (courseId: string, opts: OutputOptions & { download?: string }) => {
      const items = await fetchAllContents(courseId);

      if (opts.download) {
        const url = await resolveDownloadUrl(courseId, opts.download);
        if (!url) {
          console.error('Download URL not found');
          process.exit(1);
        }
        const target = items.find((i) => i.id === opts.download);
        const fileName = target?.contentHandler.file?.fileName ?? `${opts.download}.bin`;
        const dir = join(process.cwd(), 'downloads');
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        const outPath = join(dir, fileName);
        await downloadFile(url, outPath);
        console.log(`${t('materials.downloaded')}: ${outPath}`);
        return;
      }

      const tree = buildTree(items);
      if (tree.length === 0) {
        console.log(t('materials.empty'));
        return;
      }

      if (opts.json) {
        printJSON(tree);
      } else {
        printTree(tree);
      }
    });
}
