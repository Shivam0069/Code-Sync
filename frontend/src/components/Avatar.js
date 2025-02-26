import Image from "next/image";

export default function Avatar({ src, alt, size = 128 }) {
  return (
    <div
      className="relative rounded-full overflow-hidden"
      style={{ width: size, height: size }}
    >
      <Image
        src={src || "/placeholder.svg"}
        alt={alt}
        layout="fill"
        objectFit="cover"
      />
    </div>
  );
}
