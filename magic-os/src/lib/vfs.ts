export interface VFSNode {
  id: string; // Absolute path, e.g., "/Documents/note.txt"
  name: string;
  parentId: string; // Absolute path of parent, e.g., "/Documents". Root is ""
  type: "file" | "folder";
  content?: string; // Text content if it's a file
  createdAt: number;
  updatedAt: number;
}

const DB_NAME = "MagicOS_VFS";
const STORE_NAME = "files";
const DB_VERSION = 1;

class VirtualFileSystem {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("parentId", "parentId", { unique: false });
        }
      };
    });
  }

  // Ensure root directories exist
  async ensureRootFolders(): Promise<void> {
    await this.init();
    const roots = ["/Documents", "/Downloads", "/Pictures"];
    for (const root of roots) {
      const exists = await this.getNode(root);
      if (!exists) {
        await this.createFolder(root.replace("/", ""), "");
      }
    }
  }

  async getNode(id: string): Promise<VFSNode | null> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async listFolder(parentId: string): Promise<VFSNode[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, "readonly");
      const index = transaction.objectStore(STORE_NAME).index("parentId");
      const request = index.getAll(parentId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async createFolder(name: string, parentId: string): Promise<VFSNode> {
    await this.init();
    const id = parentId === "" ? `/${name}` : `${parentId}/${name}`;
    const node: VFSNode = {
      id,
      name,
      parentId,
      type: "folder",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return this.saveNode(node);
  }

  async createFile(name: string, parentId: string, content: string = ""): Promise<VFSNode> {
    await this.init();
    const id = parentId === "" ? `/${name}` : `${parentId}/${name}`;
    const node: VFSNode = {
      id,
      name,
      parentId,
      type: "file",
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return this.saveNode(node);
  }

  async updateFile(id: string, content: string): Promise<VFSNode> {
    const node = await this.getNode(id);
    if (!node || node.type !== "file") throw new Error("File not found");
    node.content = content;
    node.updatedAt = Date.now();
    return this.saveNode(node);
  }

  async deleteNode(id: string): Promise<void> {
    await this.init();
    // Delete children first if folder
    const children = await this.listFolder(id);
    for (const child of children) {
      await this.deleteNode(child.id);
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, "readwrite");
      const request = transaction.objectStore(STORE_NAME).delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async saveNode(node: VFSNode): Promise<VFSNode> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, "readwrite");
      const request = transaction.objectStore(STORE_NAME).put(node);
      request.onsuccess = () => resolve(node);
      request.onerror = () => reject(request.error);
    });
  }
}

export const vfs = new VirtualFileSystem();
