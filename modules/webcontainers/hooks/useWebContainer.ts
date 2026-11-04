import { useState, useEffect, useCallback, useRef } from "react";
import { WebContainer } from "@webcontainer/api";
import { TemplateFolder } from "@/modules/playground/lib/path-to-json";

interface UseWebContainerProps {
  templateData: TemplateFolder;
}

interface UseWebContaierReturn {
  serverUrl: string | null;
  isLoading: boolean;
  error: string | null;
  instance: WebContainer | null;
  writeFileSync: (path: string, content: string) => Promise<void>;
  destory: () => void;
}

export const useWebContainer = ({
  templateData,
}: UseWebContainerProps): UseWebContaierReturn => {
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [instance, setInstance] = useState<WebContainer | null>(null);

  // Ref so the unmount cleanup sees the real instance (the `instance` state in
  // the effect closure is always null, so teardown never ran before).
  const instanceRef = useRef<WebContainer | null>(null);

  useEffect(() => {
    let mounted = true;
    let unsubscribeServerReady: (() => void) | undefined;

    async function initializeWebContainer() {
      try {
        const webcontainerInstance = await WebContainer.boot();

        if (!mounted) {
          webcontainerInstance.teardown();
          return;
        }

        instanceRef.current = webcontainerInstance;

        // Listen once, at the hook level, so the URL survives the preview
        // component unmounting/remounting (hide/show preview, closing all tabs).
        unsubscribeServerReady = webcontainerInstance.on(
          "server-ready",
          (_port, url) => {
            if (mounted) setServerUrl(url);
          }
        );

        setInstance(webcontainerInstance);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to initialize WebContainer:", error);
        if (mounted) {
          setError(
            error instanceof Error
              ? error.message
              : "Failed to initialize WebContainer"
          );
          setIsLoading(false);
        }
      }
    }

    initializeWebContainer();

    return () => {
      mounted = false;
      unsubscribeServerReady?.();
      instanceRef.current?.teardown();
      instanceRef.current = null;
    };
  }, []);

  const writeFileSync = useCallback(
    async (path: string, content: string): Promise<void> => {
      if (!instance) {
        throw new Error("WebContainer instance is not available");
      }

      try {
        const pathParts = path.split("/");
        const folderPath = pathParts.slice(0, -1).join("/");

        if (folderPath) {
          await instance.fs.mkdir(folderPath, { recursive: true }); // Create folder structure recursively
        }

        await instance.fs.writeFile(path, content);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to write file";
        console.error(`Failed to write file at ${path}:`, err);
        throw new Error(`Failed to write file at ${path}: ${errorMessage}`);
      }
    },
    [instance]
  );

  const destory = useCallback(()=>{
    if(instance){
        instance.teardown()
        instanceRef.current = null;
        setInstance(null);
        setServerUrl(null)
    }
  },[instance])

  return {serverUrl , isLoading , error , instance , writeFileSync , destory}
};
