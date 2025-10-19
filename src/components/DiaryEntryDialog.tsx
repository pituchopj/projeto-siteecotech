import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Thermometer, Droplets } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { weatherService } from "@/services/weatherService";

// Validation schemas
const actionSchema = z.string().trim().min(1, "Ação não pode estar vazia").max(200, "Ação muito longa");
const noteSchema = z.string().trim().max(1000, "Nota muito longa").optional();

interface DiaryEntryDialogProps {
  userId: string;
  onEntryAdded: () => void;
}

export const DiaryEntryDialog = ({ userId, onEntryAdded }: DiaryEntryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Fetch weather data when dialog opens
  useEffect(() => {
    if (open) {
      fetchWeatherData();
    }
  }, [open]);

  const fetchWeatherData = async () => {
    setLoadingWeather(true);
    try {
      const weatherData = await weatherService.getCurrentWeather();
      setTemperature(weatherData.temperature);
      setHumidity(weatherData.humidity);
      
      if (weatherData.temperature === 0 && weatherData.humidity === 0) {
        toast.error("Não foi possível obter dados climáticos em tempo real");
      } else {
        console.log('Weather data loaded:', weatherData);
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      toast.error("Erro ao obter dados climáticos");
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    try {
      actionSchema.parse(action);
      noteSchema.parse(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('irrigation_activities')
        .insert({
          user_id: userId,
          action: action.trim(),
          note: note.trim() || null,
          temperature: temperature,
          humidity: humidity,
          weather_location: 'Fortaleza, CE'
        });

      if (error) {
        console.error("Diary entry error:", error);
        toast.error("Erro ao adicionar entrada. Tente novamente.");
        return;
      }

      toast.success("Entrada adicionada ao diário!");
      setAction("");
      setNote("");
      setOpen(false);
      onEntryAdded();
    } catch (error: any) {
      console.error("Unexpected diary entry error:", error);
      toast.error("Erro ao adicionar entrada. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="eco" className="gap-2">
          <BookOpen className="w-4 h-4" />
          Nova Entrada no Diário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Entrada no Diário</DialogTitle>
        </DialogHeader>
        
        {/* Weather Information Display */}
        {loadingWeather ? (
          <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Obtendo dados climáticos de Fortaleza...</span>
          </div>
        ) : temperature !== null && humidity !== null && (temperature !== 0 || humidity !== 0) ? (
          <div className="flex items-center justify-around p-3 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Temperatura</p>
                <p className="text-lg font-semibold">{temperature}°C</p>
              </div>
            </div>
            <div className="h-10 w-px bg-border"></div>
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Umidade</p>
                <p className="text-lg font-semibold">{humidity}%</p>
              </div>
            </div>
          </div>
        ) : null}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="action">Ação/Título *</Label>
            <Input
              id="action"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="Ex: Irrigação manual realizada"
              maxLength={200}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Anotações</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Adicione observações, detalhes ou anotações sobre esta atividade..."
              rows={4}
              maxLength={1000}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {note.length}/1000 caracteres
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};