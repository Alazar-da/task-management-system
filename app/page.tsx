'use client';
import {useRouter} from "next/navigation";


export default function Home() {
  const Router = useRouter();

  return (
 Router.push("/login")
  );
}
