import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon, SparklesIcon } from "@hugeicons/core-free-icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import "./globals.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setLoading(true);
    try {
      setGreetMsg(await invoke("greet", { name }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Tauri + React</CardTitle>
          <CardDescription>
            Enter your name and let the Rust backend greet you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="greet-form"
            onSubmit={(e) => {
              e.preventDefault();
              greet();
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="greet-input">Name</FieldLabel>
                <Input
                  id="greet-input"
                  value={name}
                  onChange={(e) => setName(e.currentTarget.value)}
                  placeholder="Enter a name..."
                />
              </Field>
            </FieldGroup>
          </form>

          {greetMsg && (
            <Alert className="mt-6">
              <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} />
              <AlertTitle>Greeting</AlertTitle>
              <AlertDescription>{greetMsg}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" form="greet-form" disabled={loading}>
            {loading ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <HugeiconsIcon
                icon={SentIcon}
                strokeWidth={2}
                data-icon="inline-start"
              />
            )}
            Greet
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

export default App;
