import { library } from '@fortawesome/fontawesome-svg-core';
import { faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { } from '@fortawesome/free-regular-svg-icons';

library.add(faChevronUp);

// Reduce dll size by only importing icons which are actually being used:
// https://fontawesome.com/how-to-use/use-with-node-js
