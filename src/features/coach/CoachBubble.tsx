import { Bot, AlertTriangle, Lightbulb, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CoachExplanation {
  type: 'blunder' | 'mistake' | 'inaccuracy' | 'good' | 'excellent' | 'brilliant';
  concepts: string[];
  explanation: string;
}

export function CoachBubble({ data, isPremium }: { data?: CoachExplanation, isPremium: boolean }) {
  if (!isPremium) {
    return (
      <Card className="border-primary/50 bg-primary/5 shadow-lg">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center gap-4">
          <div className="p-3 bg-primary/20 rounded-full">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">AI Coach Locked</h3>
            <p className="text-sm text-muted-foreground mt-1">Upgrade to Premium to get human-readable explanations of your mistakes and tactical motifs.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="bg-card shadow-sm border-border">
        <CardContent className="flex items-center gap-4 p-4 text-muted-foreground">
          <Bot className="h-6 w-6 opacity-50" />
          <p className="text-sm">Make a move or click 'Explain' to get analysis.</p>
        </CardContent>
      </Card>
    );
  }

  const isBad = ['blunder', 'mistake'].includes(data.type);
  const Icon = isBad ? AlertTriangle : (data.type === 'brilliant' ? Zap : Lightbulb);
  const colorClass = isBad ? 'text-destructive border-destructive/30 bg-destructive/10' : 'text-primary border-primary/30 bg-primary/10';

  return (
    <Card className={`border shadow-md transition-all ${colorClass}`}>
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
          <Icon className="h-4 w-4" />
          {data.type}
        </CardTitle>
        <div className="flex gap-1">
          {data.concepts.map((concept) => (
            <Badge key={concept} variant="outline" className="bg-background/50 text-xs">
              {concept}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-sm leading-relaxed">{data.explanation}</p>
      </CardContent>
    </Card>
  );
}