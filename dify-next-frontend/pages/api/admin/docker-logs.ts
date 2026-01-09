import { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

interface ContainerInfo {
  id: string;
  name: string;
  status: string;
  image: string;
}

interface LogsResponse {
  logs: string;
  timestamp: string;
}

interface ContainersResponse {
  containers: ContainerInfo[];
  timestamp: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ContainersResponse | LogsResponse | ErrorResponse>
) {
  const { action, container, lines = '100' } = req.query;

  try {
    if (action === 'list') {
      // 列出所有容器
      const { stdout } = await execPromise(
        'docker ps -a --format "{{.ID}}|||{{.Names}}|||{{.Status}}|||{{.Image}}"'
      );

      const containers: ContainerInfo[] = stdout
        .trim()
        .split('\n')
        .filter((line: string) => line)
        .map((line: string) => {
          const [id, name, status, image] = line.split('|||');
          return {
            id: id.trim(),
            name: name.trim(),
            status: status.trim(),
            image: image.trim()
          };
        });

      return res.status(200).json({
        containers,
        timestamp: new Date().toISOString()
      });
    } else if (action === 'logs' && container) {
      // 獲取指定容器的日誌
      const containerName = Array.isArray(container) ? container[0] : container;
      const tailLines = Array.isArray(lines) ? lines[0] : lines;

      const { stdout, stderr } = await execPromise(
        `docker logs --tail ${tailLines} ${containerName} 2>&1`
      );

      return res.status(200).json({
        logs: stdout || stderr || '(No logs available)',
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(400).json({
        error: 'Invalid action. Use action=list or action=logs&container=<name>'
      });
    }
  } catch (error: any) {
    console.error('Docker logs API error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch Docker information',
      details: error.stderr || error.stdout
    });
  }
}
