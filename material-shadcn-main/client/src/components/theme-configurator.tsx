import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Palette, 
  RotateCcw, 
  Download, 
  Upload,
  Settings,
  X,
  Sun,
  Moon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeConfig {
  primaryColor: string;
  primaryColorForeground: string;
  secondaryColor: string;
  secondaryColorForeground: string;
  borderRadius: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  darkMode: boolean;
}

const defaultTheme: ThemeConfig = {
  primaryColor: "0 0% 0%",
  primaryColorForeground: "0 0% 100%",
  secondaryColor: "60 4.8% 95.9%",
  secondaryColorForeground: "24 9.8% 10%",
  borderRadius: 0.75,
  fontFamily: "Inter",
  fontSize: 14,
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  darkMode: false,
};

const predefinedColors = [
  { name: "Black", value: "0 0% 0%", foreground: "0 0% 100%" },
  { name: "Blue", value: "207 90% 54%", foreground: "0 0% 100%" },
  { name: "Red", value: "0 72% 51%", foreground: "0 0% 100%" },
  { name: "Green", value: "142 71% 45%", foreground: "0 0% 100%" },
  { name: "Purple", value: "262 83% 58%", foreground: "0 0% 100%" },
  { name: "Orange", value: "25 95% 53%", foreground: "0 0% 100%" },
  { name: "Pink", value: "330 81% 60%", foreground: "0 0% 100%" },
  { name: "Cyan", value: "198 93% 60%", foreground: "0 0% 100%" },
];

const fontOptions = [
  { name: "Inter", value: "Inter" },
  { name: "Roboto", value: "Roboto" },
  { name: "Open Sans", value: "Open Sans" },
  { name: "Lato", value: "Lato" },
  { name: "Montserrat", value: "Montserrat" },
  { name: "Poppins", value: "Poppins" },
];

interface ThemeConfiguratorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeConfigurator({ isOpen, onClose }: ThemeConfiguratorProps) {
  const [theme, setTheme] = useState<ThemeConfig>(defaultTheme);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem("theme-config");
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        setTheme({ ...defaultTheme, ...parsed });
      } catch (e) {
        console.error("Failed to parse saved theme:", e);
      }
    }
  }, []);

  const applyTheme = (themeConfig: ThemeConfig) => {
    const root = document.documentElement;
    
    // Apply CSS variables
    root.style.setProperty("--primary", themeConfig.primaryColor);
    root.style.setProperty("--primary-foreground", themeConfig.primaryColorForeground);
    root.style.setProperty("--secondary", themeConfig.secondaryColor);
    root.style.setProperty("--secondary-foreground", themeConfig.secondaryColorForeground);
    root.style.setProperty("--sidebar-primary", themeConfig.primaryColor);
    root.style.setProperty("--sidebar-primary-foreground", themeConfig.primaryColorForeground);
    root.style.setProperty("--ring", themeConfig.primaryColor);
    root.style.setProperty("--sidebar-ring", themeConfig.primaryColor);
    root.style.setProperty("--radius", `${themeConfig.borderRadius}rem`);
    
    // Apply font settings
    root.style.setProperty("--theme-font-family", `'${themeConfig.fontFamily}', system-ui, -apple-system, sans-serif`);
    root.style.setProperty("--theme-font-size-base", `${themeConfig.fontSize}px`);
    root.style.setProperty("--theme-font-weight-normal", themeConfig.fontWeight.normal.toString());
    root.style.setProperty("--theme-font-weight-medium", themeConfig.fontWeight.medium.toString());
    root.style.setProperty("--theme-font-weight-semibold", themeConfig.fontWeight.semibold.toString());
    root.style.setProperty("--theme-font-weight-bold", themeConfig.fontWeight.bold.toString());
    
    // Apply dark mode
    if (themeConfig.darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const handleThemeChange = (updates: Partial<ThemeConfig>) => {
    const newTheme = { ...theme, ...updates };
    setTheme(newTheme);
    if (previewMode) {
      applyTheme(newTheme);
    }
  };

  const handlePreviewToggle = (enabled: boolean) => {
    setPreviewMode(enabled);
    if (enabled) {
      applyTheme(theme);
    } else {
      // Reset to default theme
      applyTheme(defaultTheme);
    }
  };

  const handleSave = () => {
    localStorage.setItem("theme-config", JSON.stringify(theme));
    applyTheme(theme);
    onClose();
  };

  const handleReset = () => {
    setTheme(defaultTheme);
    applyTheme(defaultTheme);
    localStorage.removeItem("theme-config");
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(theme, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'theme-config.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          const newTheme = { ...defaultTheme, ...imported };
          setTheme(newTheme);
          if (previewMode) {
            applyTheme(newTheme);
          }
        } catch (error) {
          console.error("Failed to import theme:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-0 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
              Theme Configurator
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="preview-mode" className="text-sm font-normal">
                Live Preview
              </Label>
              <Switch
                id="preview-mode"
                checked={previewMode}
                onCheckedChange={handlePreviewToggle}
              />
            </div>
            <Button variant="secondary" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {theme.darkMode ? (
                <Moon className="w-5 h-5 text-gray-600" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-500" />
              )}
              <div>
                <Label className="text-sm font-normal">Dark Mode</Label>
                <p className="text-xs text-gray-500">Toggle between light and dark themes</p>
              </div>
            </div>
            <Switch
              checked={theme.darkMode}
              onCheckedChange={(checked) => handleThemeChange({ darkMode: checked })}
            />
          </div>

          {/* Primary Color */}
          <div className="space-y-3">
            <Label className="text-sm font-normal">Primary Color</Label>
            <div className="grid grid-cols-4 gap-2">
              {predefinedColors.map((color) => (
                <Button
                  key={color.name}
                  variant="secondary"
                  size="sm"
                  className={cn(
                    "flex items-center gap-2 justify-start",
                    theme.primaryColor === color.value && "ring-2 ring-primary"
                  )}
                  onClick={() => handleThemeChange({ 
                    primaryColor: color.value,
                    primaryColorForeground: color.foreground
                  })}
                >
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: `hsl(${color.value})` }}
                  />
                  <span className="text-xs">{color.name}</span>
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Custom HSL (e.g., 207 90% 54%)"
                value={theme.primaryColor}
                onChange={(e) => handleThemeChange({ primaryColor: e.target.value })}
                className="flex-1"
              />
              <Input
                placeholder="Foreground HSL"
                value={theme.primaryColorForeground}
                onChange={(e) => handleThemeChange({ primaryColorForeground: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>

          {/* Secondary Color */}
          <div className="space-y-3">
            <Label className="text-sm font-normal">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Secondary HSL (e.g., 60 4.8% 95.9%)"
                value={theme.secondaryColor}
                onChange={(e) => handleThemeChange({ secondaryColor: e.target.value })}
                className="flex-1"
              />
              <Input
                placeholder="Foreground HSL"
                value={theme.secondaryColorForeground}
                onChange={(e) => handleThemeChange({ secondaryColorForeground: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>

          {/* Border Radius */}
          <div className="space-y-3">
            <Label className="text-sm font-normal">
              Border Radius: {theme.borderRadius}rem
            </Label>
            <Slider
              value={[theme.borderRadius]}
              onValueChange={([value]) => handleThemeChange({ borderRadius: value })}
              max={2}
              min={0}
              step={0.125}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0rem (Square)</span>
              <span>2rem (Very Rounded)</span>
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-4">
            <Label className="text-sm font-normal">Typography</Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="font-family" className="text-xs text-gray-600">Font Family</Label>
                <Select 
                  value={theme.fontFamily} 
                  onValueChange={(value) => handleThemeChange({ fontFamily: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="font-size" className="text-xs text-gray-600">
                  Base Font Size: {theme.fontSize}px
                </Label>
                <Slider
                  value={[theme.fontSize]}
                  onValueChange={([value]) => handleThemeChange({ fontSize: value })}
                  max={20}
                  min={10}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Normal Weight: {theme.fontWeight.normal}</Label>
                <Slider
                  value={[theme.fontWeight.normal]}
                  onValueChange={([value]) => handleThemeChange({ 
                    fontWeight: { ...theme.fontWeight, normal: value }
                  })}
                  max={900}
                  min={100}
                  step={100}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Medium Weight: {theme.fontWeight.medium}</Label>
                <Slider
                  value={[theme.fontWeight.medium]}
                  onValueChange={([value]) => handleThemeChange({ 
                    fontWeight: { ...theme.fontWeight, medium: value }
                  })}
                  max={900}
                  min={100}
                  step={100}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Semibold Weight: {theme.fontWeight.semibold}</Label>
                <Slider
                  value={[theme.fontWeight.semibold]}
                  onValueChange={([value]) => handleThemeChange({ 
                    fontWeight: { ...theme.fontWeight, semibold: value }
                  })}
                  max={900}
                  min={100}
                  step={100}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Bold Weight: {theme.fontWeight.bold}</Label>
                <Slider
                  value={[theme.fontWeight.bold]}
                  onValueChange={([value]) => handleThemeChange({ 
                    fontWeight: { ...theme.fontWeight, bold: value }
                  })}
                  max={900}
                  min={100}
                  step={100}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-3">
            <Label className="text-sm font-normal">Preview</Label>
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <Button size="sm">Primary Button</Button>
                <Button variant="secondary" size="sm">Secondary Button</Button>
                <Button variant="outline" size="sm">Outline Button</Button>
              </div>
              <div className="flex items-center gap-2">
                <Badge>Badge</Badge>
                <Badge variant="secondary">Secondary Badge</Badge>
                <Badge variant="outline">Outline Badge</Badge>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Sample Heading</h3>
                <p className="text-sm text-gray-600">
                  This is a sample paragraph to demonstrate the typography settings.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button variant="secondary" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <Button variant="secondary" size="sm" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </span>
                </Button>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Theme
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}