<template>
    <div>
        <p class="red">{{message}}</p>
        <button
            type="button"
            @click="onClick"
        >{{count}}</button>
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue';

export default defineComponent({
    props: {
        sdk: {
            type: String,
            required: true
        },
        language: {
            type: String,
            required: true
        },
    },

    /**
     * The new setup component option is executed before the component is created, once the props are resolved, 
     * and serves as the entry point for composition API's.
     * https://v3.vuejs.org/guide/composition-api-introduction.html#basics-of-composition-api
     */
    setup(props) {
        // https://v3.vuejs.org/guide/composition-api-introduction.html#reactive-variables-with-ref
        const count = ref(0);
        const onClick = () => {
            count.value++;
        };

        // https://v3.vuejs.org/guide/composition-api-introduction.html#standalone-computed-properties
        const message = computed(() => `Hello from ${props.sdk} and ${props.language}!`);

        // Everything that are returned will be exposed to the component template!
        return {
            message,
            count,
            onClick
        };
    }
})
</script>
