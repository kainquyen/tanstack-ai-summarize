import Navbar from './Navbar'

const ExampleWeb = () => {
  return (
    <div>
      <Navbar />
      <h2>Concicu</h2>
      <div className="mx-auto mt-10 max-w-6xl px-4 min-h-screen"></div>
      <h1 className="text-3xl font-bold">Welcome to TanStack Start!</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        This is an example web application built with TanStack Router and
        Tailwind CSS.
      </p>
    </div>
  )
}

export default ExampleWeb
