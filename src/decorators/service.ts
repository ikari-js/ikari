import { Service as TypediService } from "typedi";
import { Constructor } from "../types";
import type { ServiceOptions } from "typedi";

/**
 * Service decorator is used to define a service class. Marking a class with this decorator will make it a service. Services can be used in Controllers and other services without the need to instantiate them.
 * It should be used on a class.
 *
 * @param {ServiceOptions} options - the options for the service decorator
 *
 **/
export function Service(options?: ServiceOptions) {
  return function <T>(target: Constructor<T>) {
    TypediService(options)(target);
  };
}
