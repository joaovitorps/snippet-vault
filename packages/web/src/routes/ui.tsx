import { createFileRoute, redirect } from "@tanstack/react-router";
import { Alert, AlertDescription, AlertTitle } from "@web/components/ui/alert";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@web/components/ui/avatar";
import { Button } from "@web/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@web/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@web/components/ui/field";
import { Input } from "@web/components/ui/input";
import { Label } from "@web/components/ui/label";
import { Separator } from "@web/components/ui/separator";
import { useState, type ComponentProps, type ReactNode } from "react";

type ButtonVariant = NonNullable<ComponentProps<typeof Button>["variant"]>;
type ButtonSize = NonNullable<ComponentProps<typeof Button>["size"]>;
type AlertVariant = NonNullable<ComponentProps<typeof Alert>["variant"]>;
type AvatarSize = NonNullable<ComponentProps<typeof Avatar>["size"]>;
type CardSize = NonNullable<ComponentProps<typeof Card>["size"]>;
type FieldOrientation = NonNullable<
  ComponentProps<typeof Field>["orientation"]
>;
type ThemeMode = "light" | "dark";

const buttonVariants: ButtonVariant[] = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "link",
  "transparent",
];

const buttonSizes: ButtonSize[] = [
  "xs",
  "sm",
  "default",
  "lg",
  "icon",
  "icon-xs",
  "icon-sm",
  "icon-lg",
];

const alertVariants: AlertVariant[] = ["default", "destructive"];
const avatarSizes: AvatarSize[] = ["sm", "default", "lg"];
const cardSizes: CardSize[] = ["sm", "default"];
const fieldOrientations: FieldOrientation[] = [
  "vertical",
  "horizontal",
  "responsive",
];

const primitiveNames = [
  "Alert",
  "Avatar",
  "Button",
  "Card",
  "Field",
  "Input",
  "Label",
  "Separator",
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 border-t py-8 first:border-t-0 first:pt-0">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

export const Route = createFileRoute("/ui")({
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw redirect({ to: "/" });
    }
  },
  component: UiReferencePage,
});

function UiReferencePage() {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  return (
    <div
      data-theme={theme}
      className="rounded-lg bg-background text-foreground"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6">
        <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              UI Reference
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Installed primitives and available variants from the web package
              UI layer.
            </p>
          </div>

          <div className="flex rounded-lg border bg-card p-1">
            {(["dark", "light"] as const).map((mode) => (
              <Button
                key={mode}
                aria-pressed={theme === mode}
                size="sm"
                variant={theme === mode ? "secondary" : "transparent"}
                onClick={() => setTheme(mode)}
              >
                {mode}
              </Button>
            ))}
          </div>
        </div>

        <Section
          title="Primitive Elements"
          description="Current shadcn primitives installed under components/ui."
        >
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {primitiveNames.map((name) => (
              <div
                key={name}
                className="rounded-lg border bg-card px-3 py-2 text-sm font-medium"
              >
                {name}
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Button Variants"
          description="All color and treatment variants for the Button primitive."
        >
          <div className="flex flex-wrap gap-3">
            {buttonVariants.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ))}
          </div>
        </Section>

        <Section
          title="Button Sizes"
          description="All size variants for the Button primitive."
        >
          <div className="flex flex-wrap items-center gap-3">
            {buttonSizes.map((size) => (
              <Button key={size} size={size} variant="outline">
                {size.startsWith("icon") ? "B" : size}
              </Button>
            ))}
          </div>
        </Section>

        <Section
          title="Alert Variants"
          description="Available status treatments for inline feedback."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {alertVariants.map((variant) => (
              <Alert key={variant} variant={variant}>
                <AlertTitle>{variant}</AlertTitle>
                <AlertDescription>
                  Alert description content using the {variant} variant.
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </Section>

        <Section
          title="Avatar Variants"
          description="Avatar sizes, fallback content, groups, and badges."
        >
          <div className="flex flex-wrap items-center gap-6">
            {avatarSizes.map((size) => (
              <div key={size} className="flex items-center gap-2">
                <Avatar size={size}>
                  <AvatarFallback>
                    {size.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{size}</span>
              </div>
            ))}
            <Avatar>
              <AvatarFallback>AB</AvatarFallback>
              <AvatarBadge />
            </Avatar>
            <AvatarGroup>
              <Avatar>
                <AvatarFallback>JA</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>SV</AvatarFallback>
              </Avatar>
              <AvatarGroupCount>+2</AvatarGroupCount>
            </AvatarGroup>
          </div>
        </Section>

        <Section
          title="Card Variants"
          description="Card compositions and supported size values."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {cardSizes.map((size) => (
              <Card key={size} size={size}>
                <CardHeader>
                  <CardTitle>{size} card</CardTitle>
                  <CardDescription>
                    Header, content, and footer.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Card content preview using the {size} size.
                  </p>
                </CardContent>
                <CardFooter>Footer</CardFooter>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          title="Field Variants"
          description="Field orientation variants and related form primitives."
        >
          <FieldGroup>
            {fieldOrientations.map((orientation) => (
              <Field key={orientation} orientation={orientation}>
                <FieldLabel htmlFor={`field-${orientation}`}>
                  {orientation}
                </FieldLabel>
                <Input
                  id={`field-${orientation}`}
                  placeholder={`${orientation} field`}
                />
                <FieldDescription>
                  Description for the {orientation} field.
                </FieldDescription>
              </Field>
            ))}
          </FieldGroup>

          <FieldSet>
            <FieldLegend>Field set</FieldLegend>
            <Field>
              <FieldTitle>Field title</FieldTitle>
              <FieldDescription>
                Field title, legend, separator, and error primitives.
              </FieldDescription>
            </Field>
            <FieldSeparator>or</FieldSeparator>
            <FieldError>Example validation message.</FieldError>
          </FieldSet>
        </Section>

        <Section
          title="Input, Label, Separator"
          description="Standalone primitive previews."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="standalone-input">Standalone label</Label>
              <Input id="standalone-input" placeholder="Standalone input" />
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium">Horizontal separator</span>
              <Separator />
              <span className="text-sm text-muted-foreground">
                Vertical separator
              </span>
              <div className="flex h-8 items-center gap-3 text-sm">
                <span>Left</span>
                <Separator orientation="vertical" />
                <span>Right</span>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
