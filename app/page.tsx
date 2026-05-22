export default function Home() {
  return (
    <article className="h-screen bg-white flex flex-col justify-between p-10">
      <h1 className="text-xl font-bold">MEGA NEWS</h1>
      <h1 className="text-7xl font-extrabold text-center w-2/3 mx-auto">
        Get the latest breaking news and updates from around the world
      </h1>
      <button className="px-10 py-5 bg-black text-white rounded-lg mx-auto cursor-pointer">
        View More
      </button>
    </article>
  );
}
