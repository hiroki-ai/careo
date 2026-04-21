type Mood = "default" | "cheer" | "think" | "celebrate" | "sleep";

type Props = {
  size?: number;
  mood?: Mood;
  style?: React.CSSProperties;
  className?: string;
};

export function CareoKun({ size = 80, mood = "default", style, className }: Props) {
  const eye = (cx: number) => {
    if (mood === "sleep")
      return (
        <path
          d={`M${cx - 4} 42 Q${cx} 45 ${cx + 4} 42`}
          stroke="#0D0B21"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      );
    if (mood === "celebrate")
      return (
        <path
          d={`M${cx - 4} 38 L${cx + 4} 46 M${cx - 4} 46 L${cx + 4} 38`}
          stroke="#0D0B21"
          strokeWidth="2"
          strokeLinecap="round"
        />
      );
    if (mood === "think") return <circle cx={cx} cy="42" r="2" fill="#0D0B21" />;
    return <ellipse cx={cx} cy="42" rx="2.4" ry="3" fill="#0D0B21" />;
  };

  const mouth =
    mood === "cheer" ? (
      <path d="M42 54 Q50 62 58 54" stroke="#0D0B21" strokeWidth="2" fill="none" strokeLinecap="round" />
    ) : mood === "celebrate" ? (
      <path
        d="M40 52 Q50 64 60 52 L58 52 Q50 58 42 52 Z"
        stroke="#0D0B21"
        strokeWidth="1.5"
        fill="#fff5b4"
        strokeLinejoin="round"
      />
    ) : mood === "think" ? (
      <path d="M44 56 L56 56" stroke="#0D0B21" strokeWidth="2" strokeLinecap="round" />
    ) : mood === "sleep" ? (
      <ellipse cx="50" cy="55" rx="3" ry="2" fill="#0D0B21" />
    ) : (
      <path d="M43 53 Q50 58 57 53" stroke="#0D0B21" strokeWidth="2" fill="none" strokeLinecap="round" />
    );

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={style}
      className={className}
      aria-label="カレオくん"
      role="img"
    >
      <ellipse cx="50" cy="92" rx="28" ry="3" fill="rgba(0,0,0,0.08)" />
      <path
        d="M25 55 Q20 30 42 22 Q50 18 58 22 Q80 30 75 55 Q80 82 50 85 Q20 82 25 55 Z"
        fill="#00c896"
        stroke="#0D0B21"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <ellipse cx="33" cy="52" rx="3.5" ry="2.5" fill="#ff9b8a" opacity="0.7" />
      <ellipse cx="67" cy="52" rx="3.5" ry="2.5" fill="#ff9b8a" opacity="0.7" />
      {eye(40)}
      {eye(60)}
      {mouth}
      <path
        d="M50 18 Q55 10 62 14 Q58 20 50 22 Z"
        fill="#00a87e"
        stroke="#0D0B21"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
