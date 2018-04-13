import fontawesome from '@fortawesome/fontawesome';
import fas from '@fortawesome/fontawesome-free-solid';
import far from '@fortawesome/fontawesome-free-regular';

fontawesome.library.add(fas);
fontawesome.library.add(far);

// Reduce dll size by only importing icons which are actually being used:
// https://fontawesome.com/how-to-use/use-with-node-js
