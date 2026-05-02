import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ServiceTypeSpec, ServiceField } from "@/lib/serviceTypes";

type Props = {
  spec: ServiceTypeSpec;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
};

export const DynamicServiceForm = ({ spec, values, onChange }: Props) => {
  const main = spec.fields.filter((f) => f.group !== "extras");
  const extras = spec.fields.filter((f) => f.group === "extras");

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        {main.map((f) => (
          <FieldRenderer key={f.key} field={f} value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
        ))}
      </div>

      {extras.length > 0 && (
        <div className="border-t border-border pt-5">
          <div className="eyebrow mb-3">Extras</div>
          <div className="grid sm:grid-cols-2 gap-3">
            {extras.map((f) => (
              <FieldRenderer key={f.key} field={f} value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const FieldRenderer = ({ field, value, onChange }: {
  field: ServiceField;
  value: unknown;
  onChange: (v: unknown) => void;
}) => {
  const labelEl = (
    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">
      {field.label}{field.required && <span className="text-primary ml-1">*</span>}
    </Label>
  );

  if (field.type === "toggle") {
    return (
      <label className="flex items-center justify-between gap-3 border border-border rounded-sm p-3 bg-background hover:border-foreground/40 transition cursor-pointer">
        <div className="text-sm font-display uppercase">{field.label}</div>
        <Switch checked={value === true} onCheckedChange={(v) => onChange(v)} />
      </label>
    );
  }

  if (field.type === "yesno") {
    return (
      <div>
        {labelEl}
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: true, l: "Yes" },
            { v: false, l: "No" },
          ].map((o) => (
            <Button
              key={o.l}
              type="button"
              variant={value === o.v ? "default" : "outline"}
              onClick={() => onChange(o.v)}
              className="h-10 rounded-sm uppercase tracking-widest text-[10px]"
            >
              {o.l}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "select" && field.options) {
    return (
      <div>
        {labelEl}
        <Select value={(value as string) ?? ""} onValueChange={(v) => onChange(v)}>
          <SelectTrigger className="h-11 rounded-sm">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="sm:col-span-2">
        {labelEl}
        <Textarea
          rows={5}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="rounded-sm"
        />
      </div>
    );
  }

  if (field.type === "number") {
    return (
      <div>
        {labelEl}
        <Input
          type="number"
          value={(value as string | number) ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder={field.placeholder}
          className="h-11 rounded-sm"
        />
      </div>
    );
  }

  // text
  return (
    <div>
      {labelEl}
      <Input
        type="text"
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="h-11 rounded-sm"
      />
    </div>
  );
};
