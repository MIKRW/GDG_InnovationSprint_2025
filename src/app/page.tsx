import { Byline } from '@/components/content/Byline';
import { Logo } from '@/components/content/Logo';
import { GridContainer } from '@/components/layout/GridContainer';

export default function Home() {
  return (
    <GridContainer>
      {/* Cell 1: Top-Left */}
      <div className="col-start-1 row-start-1"></div>

      {/* Cell 2: Top-Center */}
      <div className="col-start-2 row-start-1"></div>

      {/* Cell 3: Top-Right */}
      <div className="col-start-3 row-start-1"></div>

      {/* Cell 4: Middle-Left */}
      <div className="col-start-1 row-start-2"></div>

      {/* Cell 5: Middle-Center */}
      <div className="col-start-2 row-start-2 flex items-center justify-center">
        <div
          data-component="branding-container"
          className="branding-container flex flex-col items-center justify-center text-center"
        >
          <Logo />
          <Byline>This is the main content area.</Byline>
        </div>
      </div>

      {/* Cell 6: Middle-Right */}
      <div className="col-start-3 row-start-2"></div>

      {/* Cell 7: Bottom-Left */}
      <div className="col-start-1 row-start-3"></div>

      {/* Cell 8: Bottom-Center */}
      <div className="col-start-2 row-start-3"></div>

      {/* Cell 9: Bottom-Right */}
      <div className="col-start-3 row-start-3"></div>
    </GridContainer>
  );
}
