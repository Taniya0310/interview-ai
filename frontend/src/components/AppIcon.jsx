import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  Clock3,
  Code2,
  FileText,
  Home,
  Info,
  Mic,
  MicOff,
  Play,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  Trophy,
  Video,
  Volume2,
  Wifi,
  X,
} from "lucide-react";

const icons = {
  back: ArrowLeft,
  next: ArrowRight,
  camera: Camera,
  check: Check,
  success: CircleCheck,
  error: CircleAlert,
  help: CircleHelp,
  history: Clock3,
  technical: Code2,
  document: FileText,
  home: Home,
  info: Info,
  microphone: Mic,
  microphoneOff: MicOff,
  play: Play,
  plus: Plus,
  search: Search,
  settings: Settings,
  admin: ShieldCheck,
  behavioral: Sparkles,
  stop: Square,
  delete: Trash2,
  results: Trophy,
  video: Video,
  volume: Volume2,
  connection: Wifi,
  close: X,
};

export default function AppIcon({
  name,
  size = 20,
  strokeWidth = 1.8,
  className = "",
}) {
  const Icon = icons[name];

  if (!Icon) return null;

  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden="true"
    />
  );
}