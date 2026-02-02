const workers = new Map();
const pendingTasks = new Map();
let taskIdCounter = 0;

export function getWorker(type, scriptUrl) {
  if (workers.has(type)) return workers.get(type);

  const worker = new Worker(scriptUrl, { type: "module" });
  worker.addEventListener("message", (e) => {
    const { taskId, result, error, progress } = e.data;
    if (progress && pendingTasks.has(taskId)) {
      const task = pendingTasks.get(taskId);
      if (task.onProgress) task.onProgress(progress);
      return;
    }
    if (!pendingTasks.has(taskId)) return;
    const task = pendingTasks.get(taskId);
    pendingTasks.delete(taskId);
    if (error) task.reject(new Error(error));
    else task.resolve(result);
  });

  workers.set(type, worker);
  return worker;
}

export function postTask(worker, message, onProgress) {
  const taskId = ++taskIdCounter;
  return new Promise((resolve, reject) => {
    pendingTasks.set(taskId, { resolve, reject, onProgress });
    worker.postMessage({ ...message, taskId });
  });
}

export function terminateWorker(type) {
  const worker = workers.get(type);
  if (!worker) return;
  worker.terminate();
  workers.delete(type);
}

export function terminateAll() {
  for (const [type, worker] of workers) {
    worker.terminate();
    workers.delete(type);
  }
}

export function cancelPending(worker) {
  worker.postMessage({ type: "cancel" });
}
