import { Subject } from 'rxjs';
import { switchMap, exhaustMap, share } from 'rxjs/operators';

/**
 * Method to instantiate a subject that subscribes to the observable return
 * value of the last callback projected to it and cancels the result of any
 * previous calls. The callback must be a function that returns an observable.
 */
export const takeLatestSubscriber = () => {
    let subject = new Subject();
    subject = subject.pipe(
        switchMap((callback) => callback()),
        share() // Allow subscription to in-flight http requests.
    );
    subject.subscribe();
    return subject;
};

/**
 * Method to instantiate a subject that subscribes to the observable return
 * value of the first callback passed to it and ignores anything new projected
 * to it until that observable resolves. The callback must be a function that
 * returns an observable.
 */
export const takeLeadingSubscriber = () => {
    const subject = new Subject();
    subject
        .pipe(
            exhaustMap((callback) => callback()),
            share() // Allow subscription to in-flight http requests.
        )
        .subscribe();
    return subject;
};
