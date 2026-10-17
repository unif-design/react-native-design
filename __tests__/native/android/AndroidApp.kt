package android.app
import design.boundary.Boundary
open class Application {
  val applicationContext: Application get() = this
  open fun onCreate() { Boundary.record("application.create", this) }
}
