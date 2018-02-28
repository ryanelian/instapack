import fontawesome from '@fortawesome/fontawesome';
import far from '@fortawesome/fontawesome-free-regular';
import fas from '@fortawesome/fontawesome-free-solid';

fontawesome.library.add(far);
fontawesome.library.add(fas);

// Reduce dll size by importing only those icons which are actually being used:
// https://fontawesome.com/how-to-use/use-with-node-js
